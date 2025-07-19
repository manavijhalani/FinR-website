from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from pinecone import Pinecone
from pinecone_plugins.assistant.models.chat import Message
import re
from recommendation import get_recommendation
import google.generativeai as genai
import os

# Initialize Pinecone and Assistant
pc = Pinecone(api_key='')
assistant = pc.assistant.Assistant(assistant_name="rag1")

# Initialize Gemini AI for translation
# Replace 'YOUR_GEMINI_API_KEY' with your actual Gemini API key
genai.configure(api_key='')

# Get Gemini model for translation
model = genai.GenerativeModel('Gemini 2.0 Flash Thinking Experimental 01-21')

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": "*"}})


# Global session tracking for user conversations
user_sessions = {}

# Global flag to track if recommendation flow is in progress
in_recommendation_mode = False
recommendation_state = {}

# Dictionary for mapping language codes to their names
language_names = {
    'en': 'English',
    'hi': 'Hindi',
    'gu': 'Gujarati'
}

def translate_text(text, source_lang, target_lang):
    """Translate text using Gemini."""
    if source_lang == target_lang:
        return text
    
    try:
        prompt = f"Translate the following text from {language_names.get(source_lang, source_lang)} to {language_names.get(target_lang, target_lang)}. Maintain the same tone and meaning. Here's the text: {text}"
        
        response = model.generate_content(prompt)
        translated_text = response.text
        
        # Clean up any markdown formatting that might be in the response
        translated_text = translated_text.replace('```', '').strip()
        
        return translated_text
    
    except Exception as e:
        print(f"Translation error: {e}")
        return text  # Return original text if translation fails

def is_recommendation_request(query: str) -> bool:
    """Check if the query is asking for investment recommendations."""
    recommendation_keywords = [
        "recommend", "suggestion", "advice", "advise", "invest",
        "portfolio", "allocation", "strategy", "plan", "what should i invest",
        "help me invest", "investment options"
    ]
    return any(keyword in query.lower() for keyword in recommendation_keywords)

def handle_recommendation_logic(query: str, lang: str) -> str:
    """Handle the recommendation dialogue flow with translation support."""
    global recommendation_state

    # First translate the query to English for processing
    if lang != 'en':
        query_in_english = translate_text(query, lang, 'en')
    else:
        query_in_english = query

    response_in_english = ""
    
    if 'age' not in recommendation_state:
        age_match = re.search(r'\b(\d{1,2})\b(?:\s*(?:years?(?:\s*old)?)?)?', query_in_english.lower())
        if age_match:
            age = int(age_match.group(1))
            if 18 <= age <= 100:
                recommendation_state['age'] = age
                response_in_english = "What is your annual income (in dollars)?"
        else:
            response_in_english = "Please tell me your age (between 18-100):"

    elif 'income' not in recommendation_state:
        income_match = re.search(r'\b(\d+)(?:k)?\b', query_in_english.lower())
        if income_match:
            income_str = income_match.group(1)
            income = float(income_str)
            if 'k' in query_in_english.lower():
                income *= 1000
            recommendation_state['income'] = income
            response_in_english = "On a scale of 1-5, what's your risk tolerance? (1 being very conservative, 5 being very aggressive)"
        else:
            response_in_english = "Please specify your annual income (e.g., 50000 or 50k):"

    elif 'risk' not in recommendation_state:
        risk_match = re.search(r'[1-5]', query_in_english)
        if risk_match:
            risk = int(risk_match.group())
            recommendation_state['risk'] = risk
            # Generate recommendation
            response_in_english = get_recommendation(
                recommendation_state['age'],
                recommendation_state['income'],
                risk
            )
            # Clear the state and recommendation mode after giving the recommendation
            recommendation_state = {}
        else:
            response_in_english = "Please specify your risk tolerance (1-5):"
    
    else:
        response_in_english = "I apologize, but something went wrong. Let's start over. What's your age?"

    # Translate response back to target language if needed
    if lang != 'en':
        return translate_text(response_in_english, 'en', lang)
    else:
        return response_in_english

def chunk_response(text, chunk_size=300):
    """Split a long response into chunks of max `chunk_size` characters."""
    words = text.split()
    chunks = []
    chunk = []

    for word in words:
        if sum(len(w) for w in chunk) + len(word) + len(chunk) > chunk_size:
            chunks.append(" ".join(chunk))
            chunk = []
        chunk.append(word)
    
    if chunk:
        chunks.append(" ".join(chunk))

    return chunks

@app.route("/chat", methods=["POST"])
def chat():
    global user_sessions, in_recommendation_mode

    try:
        data = request.get_json()
        user_id = data.get("user_id", "default_user")  # Track user sessions
        user_message = data.get("query")
        language = data.get("language", "en")  # Get selected language, default to English
        
        valid_languages = ['en', 'hi', 'gu']
        if language not in valid_languages:
            return jsonify({"error": "Invalid language selected. Please choose English, Hindi, or Gujarati."}), 400

        if not user_message:
            return jsonify({"error": "'query' field is missing"}), 400

        # Handle investment recommendation flow
        if is_recommendation_request(user_message) or in_recommendation_mode:
            in_recommendation_mode = True
            response = handle_recommendation_logic(user_message, language)
            if not in_recommendation_mode:
                # If recommendation flow is completed, reset the flag
                in_recommendation_mode = False
            return jsonify({"response": response})

        # Check if user has pending message chunks
        if user_id in user_sessions and user_sessions[user_id]:
            remaining_chunks = user_sessions[user_id].pop(0)  # Get next chunk
            
            # Translate remaining chunk if needed
            if language != 'en':
                remaining_chunks = translate_text(remaining_chunks, 'en', language)
                
            return jsonify({"response": remaining_chunks})

        # Translate user message to English if not in English
        if language != 'en':
            query_for_processing = translate_text(user_message, language, 'en')
        else:
            query_for_processing = user_message

        # Create message for Pinecone Assistant
        msg = Message(content=query_for_processing)
        response = assistant.chat(messages=[msg], stream=False)

        if 'message' not in response:
            return jsonify({"error": "Invalid response from assistant"}), 500

        # Get the full response in English
        full_response_english = response["message"]["content"]
        
        # Translate back to user's language if needed
        if language != 'en':
            full_response = translate_text(full_response_english, 'en', language)
        else:
            full_response = full_response_english

        # Split response into multiple messages
        response_chunks = chunk_response(full_response)

        # Store remaining chunks in session
        if len(response_chunks) > 1:
            user_sessions[user_id] = response_chunks[1:]

        return jsonify({"response": response_chunks[0]})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/<fundname>', methods=['GET'])
def get_details(fundname):
    """Fetch past and present details for a specific mutual fund."""
    api_url = "https://api.mfapi.in/mf"
    try:
        response = requests.get(api_url)
        response.raise_for_status()
        data = response.json()

        # Find the code for the given fund name
        maps = {scheme.get("schemeName"): scheme.get("schemeCode") for scheme in data}
        code = maps.get(fundname)

        if not code:
            return jsonify({"error": f"Fund name '{fundname}' not found."}), 404

        # Fetch past data for the given fund code
        past_url = f"https://api.mfapi.in/mf/{code}/latest"
        past_response = requests.get(past_url)
        past_response.raise_for_status()
        past_data = past_response.json()
        #fund_house=past_data['fund_house']
        #scheme_type=past_data['scheme_type']
        #scheme_category=past_data['scheme_category']
        #scheme_code=past_data['scheme_code']
        #scheme_name=past_data['scheme_name']
        #isin_growth=past_data['isin_growth']
        #isin_div_reinvestment=past_data['isin_reinvestment']


        if "data" not in past_data:
            return jsonify({"error": f"No historical data available for fund '{fundname}'."}), 404
        
        return jsonify(past_data)      

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to fetch data for fund '{fundname}': {str(e)}"}), 500

@app.route('/schemes', methods=['GET'])
def get_names():
    """Fetch all mutual fund schemes and return schemeName-to-schemeCode mappings."""
    api_url = "https://api.mfapi.in/mf"
    try:
        response = requests.get(api_url)
        response.raise_for_status()
        data = response.json()

        # Build a list of scheme names
        scheme_names = [scheme.get("schemeName") for scheme in data if scheme.get("schemeName")]

        
        return jsonify(scheme_names)  
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to fetch mutual fund codes: {str(e)}"}), 500
    

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
