from enum import Enum
from typing import List, Dict, Any, Optional

class VoiceIntent(str, Enum):
    # A. DASHBOARD / OVERVIEW
    GET_ACTIVE_CASE_COUNT = "GET_ACTIVE_CASE_COUNT"
    GET_PENDING_CASES = "GET_PENDING_CASES"
    GET_RESOLVED_CASES = "GET_RESOLVED_CASES"
    GET_TOTAL_CASE_COUNT = "GET_TOTAL_CASE_COUNT"
    GET_TODAY_ACTIVITY = "GET_TODAY_ACTIVITY"
    GET_LATEST_UPDATES = "GET_LATEST_UPDATES"
    GET_URGENT_ALERT_COUNT = "GET_URGENT_ALERT_COUNT"
    GET_DASHBOARD_SUMMARY = "GET_DASHBOARD_SUMMARY"
    GET_TODAY_CASE_COUNT = "GET_TODAY_CASE_COUNT"
    GET_ATTENTION_SUMMARY = "GET_ATTENTION_SUMMARY"

    # B. CASE / PERSON SEARCH
    SEARCH_PERSON = "SEARCH_PERSON"
    GET_CASE_DETAILS = "GET_CASE_DETAILS"
    LIST_ACTIVE_CASES = "LIST_ACTIVE_CASES"
    LIST_PENDING_CASES = "LIST_PENDING_CASES"
    LIST_RESOLVED_CASES = "LIST_RESOLVED_CASES"
    SEARCH_BY_LOCATION = "SEARCH_BY_LOCATION"
    GET_CASES_BY_DATE = "GET_CASES_BY_DATE"
    GET_CASE_DATE = "GET_CASE_DATE"
    GET_ASSIGNED_OFFICER = "GET_ASSIGNED_OFFICER"

    # C. ALERTS
    LIST_ACTIVE_ALERTS = "LIST_ACTIVE_ALERTS"
    GET_EMERGENCY_ALERTS = "GET_EMERGENCY_ALERTS"
    GET_HIGH_PRIORITY_ALERTS = "GET_HIGH_PRIORITY_ALERTS"
    GET_TODAY_ALERTS = "GET_TODAY_ALERTS"
    GET_LATEST_ALERT = "GET_LATEST_ALERT"
    GET_UNRESOLVED_ALERTS = "GET_UNRESOLVED_ALERTS"
    GET_TOP_PRIORITY_ALERT = "GET_TOP_PRIORITY_ALERT"
    GET_ALERTS_BY_DATE = "GET_ALERTS_BY_DATE"

    # D. REPORTS
    GET_TODAY_REPORTS = "GET_TODAY_REPORTS"
    GET_PENDING_REPORTS = "GET_PENDING_REPORTS"
    GET_RECENT_REPORTS = "GET_RECENT_REPORTS"
    GENERATE_DAILY_SUMMARY = "GENERATE_DAILY_SUMMARY"
    GET_WEEKLY_REPORTS = "GET_WEEKLY_REPORTS"
    GET_TOP_LOCATION = "GET_TOP_LOCATION"
    GET_REPORT_STATUS = "GET_REPORT_STATUS"

    # E. NAVIGATION
    NAVIGATE_DASHBOARD = "NAVIGATE_DASHBOARD"
    NAVIGATE_CASES = "NAVIGATE_CASES"
    NAVIGATE_ALERTS = "NAVIGATE_ALERTS"
    NAVIGATE_REPORTS = "NAVIGATE_REPORTS"
    CREATE_NEW_REPORT = "CREATE_NEW_REPORT"
    NAVIGATE_SEARCH = "NAVIGATE_SEARCH"
    NAVIGATE_PROFILE = "NAVIGATE_PROFILE"
    NAVIGATE_NOTIFICATIONS = "NAVIGATE_NOTIFICATIONS"

    # F. HELP / AI
    HELP = "HELP"
    HOW_TO_REGISTER_CASE = "HOW_TO_REGISTER_CASE"
    HOW_TO_CREATE_ALERT = "HOW_TO_CREATE_ALERT"
    HOW_TO_SEARCH_PERSON = "HOW_TO_SEARCH_PERSON"
    SYSTEM_STATUS = "SYSTEM_STATUS"
    ABOUT_SYSTEM = "ABOUT_SYSTEM"
    GENERAL_HELP = "GENERAL_HELP"

    # FORM MODE / DRAFT UPDATES
    START_NEW_RECORD = "START_NEW_RECORD"
    SET_FORM_FIELD = "SET_FORM_FIELD"
    UPDATE_FORM_FIELD = "UPDATE_FORM_FIELD"
    CLEAR_FORM_FIELD = "CLEAR_FORM_FIELD"
    READ_FORM = "READ_FORM"
    READ_FORM_FIELD = "READ_FORM_FIELD"
    OPEN_RECORD_FOR_EDIT = "OPEN_RECORD_FOR_EDIT"
    EDIT_RECORD_FIELD = "EDIT_RECORD_FIELD"
    CANCEL_FORM = "CANCEL_FORM"
    RESET_FORM = "RESET_FORM"
    SUBMIT_RECORD = "SUBMIT_RECORD"
    CONFIRM_SUBMIT = "CONFIRM_SUBMIT"
    CANCEL_SUBMIT = "CANCEL_SUBMIT"

    UNKNOWN = "UNKNOWN"
    CLARIFICATION_REQUIRED = "CLARIFICATION_REQUIRED"

# Central registry for exact mapping and fuzzy matching
INTENT_REGISTRY = [
    {
        "intent": VoiceIntent.GET_ACTIVE_CASE_COUNT,
        "category": "QUERY",
        "examples": [
            "how many active cases are there", "active case count", "active cases count",
            "active cases kitne hain", "kitne active case hain", "kitne active cases hain",
            "कितने एक्टिव केस हैं", "अभी कितने सक्रिय केस हैं"
        ],
    },
    {
        "intent": VoiceIntent.LIST_ACTIVE_CASES,
        "category": "LIST",
        "examples": [
            "show me active cases", "list active cases", "active cases dikhao",
            "active case list", "मुझे एक्टिव केस दिखाओ"
        ],
    },
    {
        "intent": VoiceIntent.NAVIGATE_DASHBOARD,
        "category": "NAVIGATION",
        "route": "/",
        "examples": [
            "take me to the dashboard", "open dashboard", "dashboard kholo",
            "dashboard pe le chalo", "डैशबोर्ड खोलो", "मुझे डैशबोर्ड पर ले चलो"
        ]
    },
    {
        "intent": VoiceIntent.NAVIGATE_CASES,
        "category": "NAVIGATION",
        "route": "/children",
        "examples": [
            "open the cases page", "cases page", "cases kholo",
            "take me to cases", "चिल्ड्रन पेज खोलो", "cases dikhao"
        ]
    },
    {
        "intent": VoiceIntent.NAVIGATE_ALERTS,
        "category": "NAVIGATION",
        "route": "/visits",
        "examples": [
            "open alerts", "alerts page", "alerts kholo", "alert pe jao"
        ]
    },
    {
        "intent": VoiceIntent.NAVIGATE_REPORTS,
        "category": "NAVIGATION",
        "route": "/mpr",
        "examples": [
            "open reports", "reports page", "reports kholo", "report par jao"
        ]
    },
    {
        "intent": VoiceIntent.NAVIGATE_SEARCH,
        "category": "NAVIGATION",
        "route": "/children",
        "examples": [
            "search for a person", "search person", "kisi ko search karo"
        ]
    },
    {
        "intent": VoiceIntent.SEARCH_PERSON,
        "category": "SEARCH",
        "examples": [
            "search for rahul sharma", "find a person by name", "search child",
            "rahul sharma ko dhundo", "find person"
        ]
    },
    {
        "intent": VoiceIntent.GET_PENDING_CASES,
        "category": "QUERY",
        "examples": [
            "how many cases are pending", "pending case count",
            "kitne case pending hain", "pending cases kitne hain"
        ]
    },
    {
        "intent": VoiceIntent.LIST_PENDING_CASES,
        "category": "LIST",
        "examples": [
            "show pending cases", "list pending cases", "pending case dikhao"
        ]
    },
    {
        "intent": VoiceIntent.GET_RESOLVED_CASES,
        "category": "QUERY",
        "examples": [
            "how many cases have been resolved", "resolved case count",
            "kitne case resolve hue", "resolved cases kitne hain"
        ]
    },
    {
        "intent": VoiceIntent.LIST_RESOLVED_CASES,
        "category": "LIST",
        "examples": [
            "show resolved cases", "list resolved cases", "resolved case dikhao"
        ]
    },
    {
        "intent": VoiceIntent.GET_URGENT_ALERT_COUNT,
        "category": "QUERY",
        "examples": [
            "is there any urgent alert", "urgent alert count", "how many urgent alerts",
            "kya koi urgent alert hai", "kitne urgent alert hain", "emergency kitni hai"
        ]
    },
    {
        "intent": VoiceIntent.GET_PENDING_REPORTS,
        "category": "QUERY",
        "examples": [
            "how many reports are pending verification", "how many reports are pending",
            "kitni report pending hain"
        ]
    },
    {
        "intent": VoiceIntent.GET_RECENT_REPORTS,
        "category": "LIST",
        "examples": [
            "show recently submitted reports", "recent reports", "list recent reports",
            "recent report dikhao"
        ]
    },
    {
        "intent": VoiceIntent.HELP,
        "category": "HELP",
        "examples": [
            "what can you do", "help me", "mujhe madad chahiye", "tum kya kar sakte ho", "help"
        ]
    },
    {
        "intent": VoiceIntent.SET_FORM_FIELD,
        "category": "DRAFT_UPDATE",
        "examples": [
            "weight 17 kilo hai", "height 100 cm hai", "naam rahul hai",
            "set weight to 17", "wazan 17 kg", "unchai 100", "vazan 15"
        ]
    },
    {
        "intent": VoiceIntent.SUBMIT_RECORD,
        "category": "MUTATION",
        "examples": [
            "save record", "submit record", "save it", "save karo", "submit", "record save karo"
        ]
    }
]

# We will populate the remaining ones programmatically or let the classifier use heuristics

INTENT_REGISTRY.append({'intent': VoiceIntent.GET_TOTAL_CASE_COUNT, 'category': 'QUERY', 'examples': ['what is the total number of cases', 'total cases kitne hain', 'total cases']})
INTENT_REGISTRY.append({'intent': VoiceIntent.GET_TODAY_ACTIVITY, 'category': 'QUERY', 'examples': ['show todays activity', 'today activity', 'aaj ki activity kya hai']})
INTENT_REGISTRY.append({'intent': VoiceIntent.GET_LATEST_UPDATES, 'category': 'QUERY', 'examples': ['what are the latest updates', 'latest updates dikhao', 'kya naya hai']})
INTENT_REGISTRY.append({'intent': VoiceIntent.GET_DASHBOARD_SUMMARY, 'category': 'QUERY', 'examples': ['show me the dashboard summary', 'dashboard summary', 'dashboard ka summary dikhao']})
INTENT_REGISTRY.append({'intent': VoiceIntent.GET_TODAY_CASE_COUNT, 'category': 'QUERY', 'examples': ['how many cases were added today', 'aaj kitne case add hue', 'today case count']})
INTENT_REGISTRY.append({'intent': VoiceIntent.GET_ATTENTION_SUMMARY, 'category': 'QUERY', 'examples': ['what needs my attention', 'attention summary', 'kya zaroori hai', 'mujhe kya dekhna chahiye']})
INTENT_REGISTRY.append({'intent': VoiceIntent.GET_CASE_DETAILS, 'category': 'QUERY', 'examples': ['find details for case', 'case details dikhao', 'is case ki detail kya hai']})
INTENT_REGISTRY.append({'intent': VoiceIntent.SEARCH_BY_LOCATION, 'category': 'SEARCH', 'examples': ['search cases from pune', 'pune ke cases dikhao', 'location search', 'is location ke cases']})
INTENT_REGISTRY.append({'intent': VoiceIntent.GET_CASES_BY_DATE, 'category': 'LIST', 'examples': ['show cases registered this week', 'is hafte ke cases dikhao', 'aaj ke cases']})
INTENT_REGISTRY.append({'intent': VoiceIntent.GET_CASE_DATE, 'category': 'QUERY', 'examples': ['when was this case registered', 'ye case kab register hua tha', 'case date kya hai']})
INTENT_REGISTRY.append({'intent': VoiceIntent.GET_ASSIGNED_OFFICER, 'category': 'QUERY', 'examples': ['who is handling this case', 'is case ko kaun dekh raha hai', 'assigned officer kaun hai']})
INTENT_REGISTRY.append({'intent': VoiceIntent.LIST_ACTIVE_ALERTS, 'category': 'LIST', 'examples': ['show active alerts', 'active alerts dikhao', 'kya active alerts hain']})
INTENT_REGISTRY.append({'intent': VoiceIntent.GET_EMERGENCY_ALERTS, 'category': 'QUERY', 'examples': ['are there any emergency alerts', 'kya koi emergency alert hai', 'emergency alert dikhao']})
INTENT_REGISTRY.append({'intent': VoiceIntent.GET_HIGH_PRIORITY_ALERTS, 'category': 'LIST', 'examples': ['show high priority alerts', 'high priority alert dikhao']})
INTENT_REGISTRY.append({'intent': VoiceIntent.GET_TODAY_ALERTS, 'category': 'QUERY', 'examples': ['how many alerts were generated today', 'aaj kitne alert aaye', 'today alerts']})
INTENT_REGISTRY.append({'intent': VoiceIntent.GET_LATEST_ALERT, 'category': 'QUERY', 'examples': ['what is the latest alert', 'latest alert kya hai', 'aakhri alert kaunsa hai']})
INTENT_REGISTRY.append({'intent': VoiceIntent.GET_UNRESOLVED_ALERTS, 'category': 'LIST', 'examples': ['show unresolved alerts', 'unresolved alerts dikhao']})
INTENT_REGISTRY.append({'intent': VoiceIntent.GET_TOP_PRIORITY_ALERT, 'category': 'QUERY', 'examples': ['which alert is most urgent', 'sabse urgent alert kaunsa hai', 'top priority alert']})
INTENT_REGISTRY.append({'intent': VoiceIntent.GET_ALERTS_BY_DATE, 'category': 'LIST', 'examples': ['show alerts from today', 'aaj ke alerts dikhao', 'is date ke alerts']})
INTENT_REGISTRY.append({'intent': VoiceIntent.GET_TODAY_REPORTS, 'category': 'LIST', 'examples': ['show todays reports', 'aaj ki reports dikhao', 'today reports']})
INTENT_REGISTRY.append({'intent': VoiceIntent.GENERATE_DAILY_SUMMARY, 'category': 'MUTATION', 'examples': ['generate a summary of todays reports', 'aaj ki reports ka summary banao', 'daily summary banao']})
INTENT_REGISTRY.append({'intent': VoiceIntent.GET_WEEKLY_REPORTS, 'category': 'LIST', 'examples': ['show reports from this week', 'is hafte ki reports dikhao']})
INTENT_REGISTRY.append({'intent': VoiceIntent.GET_TOP_LOCATION, 'category': 'QUERY', 'examples': ['which location has the most reports', 'sabse zyada reports kis location ki hain', 'top location']})
INTENT_REGISTRY.append({'intent': VoiceIntent.GET_REPORT_STATUS, 'category': 'QUERY', 'examples': ['what is the status of my report', 'meri report ka status kya hai']})
INTENT_REGISTRY.append({'intent': VoiceIntent.CREATE_NEW_REPORT, 'category': 'NAVIGATION', 'route': '/mpr', 'examples': ['start a new report', 'nay report banao', 'create report']})
INTENT_REGISTRY.append({'intent': VoiceIntent.NAVIGATE_PROFILE, 'category': 'NAVIGATION', 'route': '/login', 'examples': ['show my profile', 'mera profile dikhao', 'open profile']})
INTENT_REGISTRY.append({'intent': VoiceIntent.NAVIGATE_NOTIFICATIONS, 'category': 'NAVIGATION', 'route': '/visits', 'examples': ['open notifications', 'notifications kholo']})
INTENT_REGISTRY.append({'intent': VoiceIntent.HOW_TO_REGISTER_CASE, 'category': 'HELP', 'examples': ['how do i register a new case', 'naya case kaise register karu']})
INTENT_REGISTRY.append({'intent': VoiceIntent.HOW_TO_CREATE_ALERT, 'category': 'HELP', 'examples': ['how do i create an alert', 'alert kaise banau']})
INTENT_REGISTRY.append({'intent': VoiceIntent.HOW_TO_SEARCH_PERSON, 'category': 'HELP', 'examples': ['how do i search for a person', 'kisi ko kaise dhundu']})
INTENT_REGISTRY.append({'intent': VoiceIntent.SYSTEM_STATUS, 'category': 'HELP', 'examples': ['what is the status of the system', 'system ka status kya hai']})
INTENT_REGISTRY.append({'intent': VoiceIntent.ABOUT_SYSTEM, 'category': 'HELP', 'examples': ['what does this application do', 'ye application kya karti hai']})
INTENT_REGISTRY.append({'intent': VoiceIntent.GENERAL_HELP, 'category': 'HELP', 'examples': ['help me', 'meri madad karo']})
INTENT_REGISTRY.append({'intent': VoiceIntent.START_NEW_RECORD, 'category': 'NAVIGATION', 'route': '/growth', 'examples': ['start new record', 'naya record shuru karo', 'new record']})
INTENT_REGISTRY.append({'intent': VoiceIntent.UPDATE_FORM_FIELD, 'category': 'DRAFT_UPDATE', 'examples': ['update form field', 'change weight to', 'vazan change karo', 'weight nahi']})
INTENT_REGISTRY.append({'intent': VoiceIntent.CLEAR_FORM_FIELD, 'category': 'DRAFT_UPDATE', 'examples': ['clear weight', 'vazan hata do', 'remove weight', 'clear field']})
INTENT_REGISTRY.append({'intent': VoiceIntent.READ_FORM, 'category': 'HELP', 'examples': ['read it back', 'what have i entered', 'form dikhao', 'maine kya bhara hai', 'read form']})
INTENT_REGISTRY.append({'intent': VoiceIntent.READ_FORM_FIELD, 'category': 'HELP', 'examples': ['read field', 'weight kya hai', 'kya bhara hai isme']})
INTENT_REGISTRY.append({'intent': VoiceIntent.OPEN_RECORD_FOR_EDIT, 'category': 'NAVIGATION', 'route': '/growth', 'examples': ['open record for edit', 'record edit karne ke liye kholo']})
INTENT_REGISTRY.append({'intent': VoiceIntent.EDIT_RECORD_FIELD, 'category': 'DRAFT_UPDATE', 'examples': ['edit record field', 'edit weight']})
INTENT_REGISTRY.append({'intent': VoiceIntent.CANCEL_FORM, 'category': 'DRAFT_UPDATE', 'examples': ['cancel form', 'form cancel karo']})
INTENT_REGISTRY.append({'intent': VoiceIntent.RESET_FORM, 'category': 'DRAFT_UPDATE', 'examples': ['reset form', 'form reset karo']})
INTENT_REGISTRY.append({'intent': VoiceIntent.CONFIRM_SUBMIT, 'category': 'MUTATION', 'examples': ['confirm', 'haan', 'yes', 'save kardo']})
INTENT_REGISTRY.append({'intent': VoiceIntent.CANCEL_SUBMIT, 'category': 'DRAFT_UPDATE', 'examples': ['cancel', 'nahi', 'no', 'mat save karo']})
