import re
import google.generativeai as genai
from datetime import datetime, timedelta
import numpy as np
import json

def setup_gemini(api_key):
    """Setup Gemini AI with the provided API key."""
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-2.0-flash')

def is_calculation_query(query):
    """Check if a query is calculation-based."""
    # Patterns for calculation queries
    sip_patterns = [
        r'sip', r'systematic investment plan', r'monthly investment',
        r'calculate (my )?returns', r'investment calculator', r'calculate interest'
    ]
    
    # Check for fund details queries starting with @
    fund_pattern = r'@([a-zA-Z0-9\s]+)'
    
    # Check if any SIP pattern matches
    for pattern in sip_patterns:
        if re.search(pattern, query.lower()):
            return "sip"
    
    # Check if the fund pattern matches
    if re.search(fund_pattern, query):
        return "fund"
    
    return None

def extract_fund_name(query):
    """Extract fund name from a query containing @."""
    match = re.search(r'@([a-zA-Z0-9\s]+)', query)
    if match:
        return match.group(1).strip()
    return None

def extract_sip_parameters(query, model):
    """Extract SIP calculation parameters from the query using Gemini."""
    try:
        prompt = """
        Extract SIP (Systematic Investment Plan) calculation parameters from the following query.
        Return a JSON with these keys:
        - monthly_investment: Monthly investment amount in numbers only
        - interest_rate: Annual interest rate as a percentage (number only)
        - time_period: Investment duration in years (number only)
        - lump_sum: Any initial lump sum amount (number only, 0 if not specified)
        
        If any parameter is missing, set its value to null.
        
        Query: {query}
        """
        
        response = model.generate_content(prompt.format(query=query))
        
        # Process the response to extract the JSON
        import json
        # Clean up the response to get just the JSON part
        response_text = response.text
        # Remove markdown code block markers if present
        response_text = response_text.replace('```json', '').replace('```', '')
        
        # Parse the JSON
        params = json.loads(response_text)
        return params
    
    except Exception as e:
        print(f"Error extracting SIP parameters: {e}")
        return {
            "monthly_investment": None,
            "interest_rate": None,
            "time_period": None,
            "lump_sum": 0
        }

def calculate_sip(monthly_investment, interest_rate, time_period, lump_sum=0):
    """
    Calculate SIP returns.
    
    Parameters:
    - monthly_investment: Monthly investment amount
    - interest_rate: Annual interest rate (as a percentage)
    - time_period: Investment duration in years
    - lump_sum: Initial lump sum investment (optional)
    
    Returns:
    - Dictionary with calculation results
    """
    if None in [monthly_investment, interest_rate, time_period]:
        return {"error": "Missing required parameters"}
    
    try:
        # Convert inputs to appropriate types
        monthly_investment = float(monthly_investment)
        interest_rate = float(interest_rate)
        time_period = float(time_period)
        lump_sum = float(lump_sum) if lump_sum is not None else 0
        
        # Convert annual interest rate to monthly
        monthly_rate = interest_rate / 12 / 100
        
        # Calculate number of months
        months = int(time_period * 12)
        
        # Calculate future value of SIP
        sip_future_value = monthly_investment * (((1 + monthly_rate) ** months - 1) / monthly_rate) * (1 + monthly_rate)
        
        # Calculate future value of lump sum
        lump_sum_future_value = lump_sum * ((1 + interest_rate/100) ** time_period)
        
        # Total future value
        total_future_value = sip_future_value + lump_sum_future_value
        
        # Total investment
        total_investment = monthly_investment * months + lump_sum
        
        # Total returns
        total_returns = total_future_value - total_investment
        
        # Prepare result
        result = {
            "monthly_investment": monthly_investment,
            "interest_rate": interest_rate,
            "time_period": time_period,
            "lump_sum": lump_sum,
            "total_investment": round(total_investment, 2),
            "total_returns": round(total_returns, 2),
            "total_future_value": round(total_future_value, 2),
            "missing_parameters": []
        }
        
        return result
        
    except Exception as e:
        return {"error": f"Calculation error: {str(e)}"}

def get_missing_parameters(params):
    """Identify which parameters are missing for SIP calculation."""
    missing = []
    if params["monthly_investment"] is None:
        missing.append("monthly_investment")
    if params["interest_rate"] is None:
        missing.append("interest_rate")
    if params["time_period"] is None:
        missing.append("time_period")
    return missing

def format_calculation_result(result, translate_func=None, target_lang='en'):
    """Format calculation results into a readable response."""
    if "error" in result:
        response = f"Error in calculation: {result['error']}"
        return translate_func(response, 'en', target_lang) if translate_func else response
    
    response = f"""
Based on your inputs:
- Monthly Investment: ₹{result['monthly_investment']:,.2f}
- Annual Interest Rate: {result['interest_rate']}%
- Time Period: {result['time_period']} years
- Initial Lump Sum: ₹{result['lump_sum']:,.2f}

Your SIP calculation results:
- Total Amount Invested: ₹{result['total_investment']:,.2f}
- Total Returns: ₹{result['total_returns']:,.2f}
- Maturity Value: ₹{result['total_future_value']:,.2f}

This calculation assumes a constant interest rate throughout the investment period.
"""
    return translate_func(response, 'en', target_lang) if translate_func else response

def handle_calculation_query(query, model, translate_func=None, source_lang='en', target_lang='en'):
    """Handle calculation-based queries."""
    # Translate query to English if needed
    if source_lang != 'en' and translate_func:
        query = translate_func(query, source_lang, 'en')
    
    calc_type = is_calculation_query(query)
    
    if calc_type == "sip":
        # Extract parameters
        params = extract_sip_parameters(query, model)
        missing = get_missing_parameters(params)
        
        if missing:
            # Ask for missing parameters
            missing_param_names = {
                "monthly_investment": "monthly investment amount",
                "interest_rate": "annual interest rate (as a percentage)",
                "time_period": "investment duration in years"
            }
            
            response = f"To calculate your SIP returns, I need the following information: {', '.join([missing_param_names[param] for param in missing])}"
            return {
                "response": translate_func(response, 'en', target_lang) if translate_func else response,
                "complete": False,
                "params": params,
                "missing": missing
            }
        
        # Calculate SIP returns
        result = calculate_sip(
            params["monthly_investment"],
            params["interest_rate"],
            params["time_period"],
            params["lump_sum"]
        )
        
        response = format_calculation_result(result, translate_func, target_lang)
        return {
            "response": response,
            "complete": True,
            "result": result
        }
    
    elif calc_type == "fund":
        fund_name = extract_fund_name(query)
        return {
            "response": translate_func(f"You asked about the fund: {fund_name}", 'en', target_lang) if translate_func else f"You asked about the fund: {fund_name}",
            "complete": True,
            "fund_name": fund_name,
            "action": "fetch_fund_details"
        }
    
    return {
        "response": "I couldn't identify a calculation request.",
        "complete": True
    }

def update_sip_parameters(params, query, model):
    """Update SIP parameters based on user's response."""
    try:
        # Extract the value from the user's response
        prompt = f"""
        The user provided this response for a missing SIP parameter: "{query}"
        Extract just the numerical value from this response.
        Return only the number, with no additional text.
        """
        
        response = model.generate_content(prompt)
        extracted_value = float(response.text.strip())
        
        # Determine which parameter to update based on the missing parameters
        if "monthly_investment" in params.get("missing", []):
            params["params"]["monthly_investment"] = extracted_value
            params["missing"].remove("monthly_investment")
        elif "interest_rate" in params.get("missing", []):
            params["params"]["interest_rate"] = extracted_value
            params["missing"].remove("interest_rate")
        elif "time_period" in params.get("missing", []):
            params["params"]["time_period"] = extracted_value
            params["missing"].remove("time_period")
        
        return params
        
    except Exception as e:
        print(f"Error updating SIP parameters: {e}")
        return params

def analyze_fund_data(nav_data, question, fund_name, model):
    """
    Analyze fund NAV data based on user's question using Gemini.
    
    Parameters:
    - nav_data: List of NAV data points with dates
    - question: User's question about the fund
    - fund_name: Name of the fund
    - model: Gemini model instance
    
    Returns:
    - Analysis as a string
    """
    try:
        # Prepare data for analysis
        nav_data_sorted = sorted(nav_data, key=lambda x: datetime.strptime(x.get('date', ''), '%d-%m-%Y'))
        
        # Get latest and oldest NAV records
        latest_nav = nav_data_sorted[0]
        oldest_nav = nav_data_sorted[-1]
        
        # Calculate duration between dates in years
        latest_date = datetime.strptime(latest_nav.get('date', ''), '%d-%m-%Y')
        oldest_date = datetime.strptime(oldest_nav.get('date', ''), '%d-%m-%Y')
        days_diff = (latest_date - oldest_date).days
        years = days_diff / 365.25
        
        # Calculate growth metrics
        latest_nav_value = float(latest_nav.get('nav', 0))
        oldest_nav_value = float(oldest_nav.get('nav', 0))
        
        absolute_growth = ((latest_nav_value - oldest_nav_value) / oldest_nav_value) * 100
        annualized_growth = (((latest_nav_value / oldest_nav_value) ** (1/years)) - 1) * 100 if years > 0 else 0
        
        # Calculate volatility (standard deviation of returns)
        daily_returns = []
        for i in range(1, min(100, len(nav_data_sorted))):  # Limit to 100 data points for efficiency
            current_nav = float(nav_data_sorted[i-1].get('nav', 0))
            previous_nav = float(nav_data_sorted[i].get('nav', 0))
            if previous_nav > 0:
                daily_return = (current_nav - previous_nav) / previous_nav
                daily_returns.append(daily_return)
        
        volatility = np.std(daily_returns) * np.sqrt(252) * 100 if daily_returns else 0  # Annualized volatility
        
        # Calculate 1-month, 3-month, 6-month, 1-year returns if data is available
        periods = {
            "1_month": 30,
            "3_month": 90,
            "6_month": 180,
            "1_year": 365
        }
        
        period_returns = {}
        for period_name, days in periods.items():
            if days_diff >= days:
                # Find the closest NAV to the period
                target_date = latest_date - timedelta(days=days)
                closest_nav = nav_data_sorted[0]
                min_diff = float('inf')
                
                for nav in nav_data_sorted:
                    nav_date = datetime.strptime(nav.get('date', ''), '%d-%m-%Y')
                    diff = abs((nav_date - target_date).days)
                    if diff < min_diff:
                        min_diff = diff
                        closest_nav = nav
                
                period_nav_value = float(closest_nav.get('nav', 0))
                period_return = ((latest_nav_value - period_nav_value) / period_nav_value) * 100
                period_returns[period_name] = period_return
        
        # Format period returns properly
        one_month = f"{period_returns.get('1_month'):.2f}%" if '1_month' in period_returns else 'Not available'
        three_month = f"{period_returns.get('3_month'):.2f}%" if '3_month' in period_returns else 'Not available'
        six_month = f"{period_returns.get('6_month'):.2f}%" if '6_month' in period_returns else 'Not available'
        one_year = f"{period_returns.get('1_year'):.2f}%" if '1_year' in period_returns else 'Not available'
        
        # Create a prompt that analyzes the fund data based on the user's question
        prompt = f"""
        As a financial advisor, analyze this mutual fund data and answer the following question:
        "{question}"
        
        Fund Information:
        - Fund Name: {fund_name}
        - Latest NAV: ₹{latest_nav_value} (as of {latest_nav.get('date')})
        - Initial NAV in dataset: ₹{oldest_nav_value} (as of {oldest_nav.get('date')})
        - Time Period: {years:.2f} years
        - Total Growth: {absolute_growth:.2f}%
        - Annualized Growth Rate: {annualized_growth:.2f}%
        - Volatility: {volatility:.2f}%
        
        Period Returns:
        - 1 Month: {one_month}
        - 3 Months: {three_month}
        - 6 Months: {six_month}
        - 1 Year: {one_year}
        
        Recent NAV Data (Last 5 entries):
        {json.dumps(nav_data_sorted[:5], indent=2)}
        
        Based on this data, provide:
        1. A direct answer to the user's question about the fund
        2. Additional relevant insights about the fund's performance
        3. A brief conclusion about the fund's performance relative to typical market expectations
        
        Keep your response concise, informative, and focused on the data provided.
        """
        
        # Generate analysis using Gemini
        response = model.generate_content(prompt)
        analysis = response.text
        
        return analysis
        
    except Exception as e:
        print(f"Error analyzing fund data: {e}")
        return f"I encountered an error while analyzing the fund data: {str(e)}. Please try again with a different question or fund."