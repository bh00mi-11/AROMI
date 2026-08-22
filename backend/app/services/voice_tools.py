from typing import Literal, Optional, List, Any
from pydantic import BaseModel, Field

# ==============================================================
# TOOL SCHEMAS FOR LLM
# ==============================================================

class NavigateTool(BaseModel):
    """Navigate to a specific page or route in the application."""
    tool: Literal["NAVIGATE"] = "NAVIGATE"
    route: str = Field(..., description="The route to navigate to (e.g. '/dashboard', '/children', '/mpr', '/visits', '/growth').")

class GoBackTool(BaseModel):
    """Go to the previous page."""
    tool: Literal["GO_BACK"] = "GO_BACK"

class OpenRecordTool(BaseModel):
    """Open a specific child's detailed profile/record."""
    tool: Literal["OPEN_RECORD"] = "OPEN_RECORD"
    child_name: Optional[str] = Field(None, description="The name of the child to open.")
    result_index: Optional[int] = Field(None, description="If referring to search results (1 for first, 2 for second, etc).")

class SearchRecordsTool(BaseModel):
    """Search for children records by name, location, or status."""
    tool: Literal["SEARCH_RECORDS"] = "SEARCH_RECORDS"
    name: Optional[str] = Field(None, description="Name to search for.")
    location: Optional[str] = Field(None, description="Village or city (e.g. Pune).")
    status: Optional[str] = Field(None, description="Status like 'sam', 'mam', 'normal'.")

class GetCountTool(BaseModel):
    """Get the count of a specific resource (active cases, pending cases, etc)."""
    tool: Literal["GET_COUNT"] = "GET_COUNT"
    resource: str = Field(..., description="The resource to count (e.g., 'active_cases', 'pending_cases', 'resolved_cases', 'urgent_alerts', 'today_cases', 'pending_reports', 'today_reports').")

class GetListTool(BaseModel):
    """Get a list of records for a specific resource."""
    tool: Literal["GET_LIST"] = "GET_LIST"
    resource: str = Field(..., description="The resource (e.g., 'alerts', 'reports', 'children', 'urgent_alerts', 'resolved_cases').")
    date_filter: Optional[str] = Field(None, description="Date filter (e.g., 'today', 'this_week').")

class GetSummaryTool(BaseModel):
    """Get a summary of the dashboard or current status."""
    tool: Literal["GET_SUMMARY"] = "GET_SUMMARY"
    resource: str = Field(..., description="Resource (e.g., 'dashboard', 'attention', 'daily_reports').")

class SetFormFieldTool(BaseModel):
    """Update a specific field in the currently active form."""
    tool: Literal["SET_FORM_FIELD"] = "SET_FORM_FIELD"
    field: str = Field(..., description="The field name (e.g. 'weight_kg', 'height_cm', 'name').")
    value: float = Field(..., description="The numeric or text value to set.")

class ClearFormFieldTool(BaseModel):
    """Clear a specific field in the active form."""
    tool: Literal["CLEAR_FORM_FIELD"] = "CLEAR_FORM_FIELD"
    field: str = Field(..., description="The field name to clear.")

class ReadFormTool(BaseModel):
    """Read back the contents of the currently active form."""
    tool: Literal["READ_FORM"] = "READ_FORM"

class SubmitFormTool(BaseModel):
    """Save or submit the current form or record. (Requires Confirmation)."""
    tool: Literal["SUBMIT_FORM"] = "SUBMIT_FORM"

class CancelActionTool(BaseModel):
    """Cancel the current draft or action."""
    tool: Literal["CANCEL_ACTION"] = "CANCEL_ACTION"

class HelpTool(BaseModel):
    """Provide help or explain what the user can do on the current page."""
    tool: Literal["HELP"] = "HELP"

# Define all available tools
ALL_TOOLS = [
    NavigateTool, GoBackTool, OpenRecordTool, SearchRecordsTool,
    GetCountTool, GetListTool, GetSummaryTool, SetFormFieldTool,
    ClearFormFieldTool, ReadFormTool, SubmitFormTool, CancelActionTool, HelpTool
]
