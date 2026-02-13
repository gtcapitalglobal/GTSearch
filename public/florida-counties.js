// Florida Counties Mapping - 67 Counties with Appraisal Links
// Source: Google Sheets - Info Florida Dashboard
// Column B: APPRAISAL links

const FLORIDA_COUNTIES = {
  "ALACHUA": "https://www.acpafl.org/",
  "BAKER": "https://qpublic.schneidercorp.com/Application.aspx?AppID=1067&LayerID=22538&PageTypeID=4&PageID=10198&Q=1964494354",
  "BAY": "https://qpublic.schneidercorp.com/Application.aspx?AppID=1067&LayerID=22538&PageTypeID=4&PageID=10198&Q=1964494354",
  "BRADFORD": "https://qpublic.schneidercorp.com/Application.aspx?AppID=1067&LayerID=22538&PageTypeID=4&PageID=10198&Q=1964494354",
  "BREVARD": "https://www.bcpao.us/",
  "BROWARD": "https://web.bcpa.net/",
  "CALHOUN": "https://qpublic.schneidercorp.com/Application.aspx?AppID=1067&LayerID=22538&PageTypeID=4&PageID=10198&Q=1964494354",
  "CHARLOTTE": "https://www.ccappraiser.com/",
  "CITRUS": "https://www.citruspa.org/",
  "CLAY": "https://www.ccpao.com/",
  "COLLIER": "https://www.collierappraiser.com/",
  "COLUMBIA": "https://qpublic.schneidercorp.com/Application.aspx?AppID=1067&LayerID=22538&PageTypeID=4&PageID=10198&Q=1964494354",
  "DESOTO": "https://qpublic.schneidercorp.com/Application.aspx?AppID=1067&LayerID=22538&PageTypeID=4&PageID=10198&Q=1964494354",
  "DIXIE": "https://qpublic.schneidercorp.com/Application.aspx?AppID=1067&LayerID=22538&PageTypeID=4&PageID=10198&Q=1964494354",
  "DUVAL": "https://pafl.coj.net/",
  "ESCAMBIA": "https://www.escpa.org/",
  "FLAGLER": "https://www.flaglerpa.com/",
  "FRANKLIN": "https://qpublic.schneidercorp.com/Application.aspx?AppID=1067&LayerID=22538&PageTypeID=4&PageID=10198&Q=1964494354",
  "GADSDEN": "https://qpublic.schneidercorp.com/Application.aspx?AppID=1067&LayerID=22538&PageTypeID=4&PageID=10198&Q=1964494354",
  "GILCHRIST": "https://qpublic.schneidercorp.com/Application.aspx?AppID=1067&LayerID=22538&PageTypeID=4&PageID=10198&Q=1964494354",
  "GLADES": "https://qpublic.schneidercorp.com/Application.aspx?AppID=1067&LayerID=22538&PageTypeID=4&PageID=10198&Q=1964494354",
  "GULF": "https://qpublic.schneidercorp.com/Application.aspx?AppID=1067&LayerID=22538&PageTypeID=4&PageID=10198&Q=1964494354",
  "HAMILTON": "https://qpublic.schneidercorp.com/Application.aspx?AppID=1067&LayerID=22538&PageTypeID=4&PageID=10198&Q=1964494354",
  "HARDEE": "https://qpublic.schneidercorp.com/Application.aspx?AppID=1067&LayerID=22538&PageTypeID=4&PageID=10198&Q=1964494354",
  "HENDRY": "https://www.hendrypa.net/",
  "HERNANDO": "https://www.hernandocounty.us/departments/departments-a-c/property-appraiser",
  "HIGHLANDS": "https://www.hcpao.org/",
  "HILLSBOROUGH": "https://www.hcpafl.org/",
  "HOLMES": "https://qpublic.schneidercorp.com/Application.aspx?AppID=1067&LayerID=22538&PageTypeID=4&PageID=10198&Q=1964494354",
  "INDIAN RIVER": "https://www.ircpa.org/",
  "JACKSON": "https://qpublic.schneidercorp.com/Application.aspx?AppID=1067&LayerID=22538&PageTypeID=4&PageID=10198&Q=1964494354",
  "JEFFERSON": "https://qpublic.schneidercorp.com/Application.aspx?AppID=1067&LayerID=22538&PageTypeID=4&PageID=10198&Q=1964494354",
  "LAFAYETTE": "https://qpublic.schneidercorp.com/Application.aspx?AppID=1067&LayerID=22538&PageTypeID=4&PageID=10198&Q=1964494354",
  "LAKE": "https://www.lakecopropappr.com/",
  "LEE": "https://www.leepa.org/",
  "LEON": "https://www.leonpa.org/",
  "LEVY": "https://qpublic.schneidercorp.com/Application.aspx?AppID=1067&LayerID=22538&PageTypeID=4&PageID=10198&Q=1964494354",
  "LIBERTY": "https://qpublic.schneidercorp.com/Application.aspx?AppID=1067&LayerID=22538&PageTypeID=4&PageID=10198&Q=1964494354",
  "MADISON": "https://qpublic.schneidercorp.com/Application.aspx?AppID=1067&LayerID=22538&PageTypeID=4&PageID=10198&Q=1964494354",
  "MANATEE": "https://www.manateepao.com/",
  "MARION": "https://www.pa.marion.fl.us/",
  "MARTIN": "https://www.pa.martin.fl.us/",
  "MIAMI-DADE": "https://www.miamidade.gov/pa/",
  "MONROE": "https://www.mcpafl.org/",
  "NASSAU": "https://www.nassauflpa.com/",
  "OKALOOSA": "https://www.okaloosapa.com/",
  "OKEECHOBEE": "https://www.okeechobeepa.com/",
  "ORANGE": "https://www.ocpafl.org/",
  "OSCEOLA": "https://www.property-appraiser.org/",
  "PALM BEACH": "https://www.pbcgov.org/papa/",
  "PASCO": "https://www.pascopa.com/",
  "PINELLAS": "https://www.pcpao.org/",
  "POLK": "https://www.polkpa.org/",
  "PUTNAM": "https://qpublic.schneidercorp.com/Application.aspx?AppID=1067&LayerID=22538&PageTypeID=4&PageID=10198&Q=1964494354",
  "SAINT JOHNS": "https://www.sjcpa.us/",
  "SAINT LUCIE": "https://www.paslc.gov/",
  "SANTA ROSA": "https://www.srcpa.org/",
  "SARASOTA": "https://www.sc-pa.com/",
  "SEMINOLE": "https://www.scpafl.org/",
  "ST JOHNS": "https://www.sjcpa.us/",
  "ST LUCIE": "https://www.paslc.gov/",
  "ST. JOHNS": "https://www.sjcpa.us/",
  "ST. LUCIE": "https://www.paslc.gov/",
  "SUMTER": "https://www.sumterpa.com/",
  "SUWANNEE": "https://qpublic.schneidercorp.com/Application.aspx?AppID=1067&LayerID=22538&PageTypeID=4&PageID=10198&Q=1964494354",
  "TAYLOR": "https://qpublic.schneidercorp.com/Application.aspx?AppID=1067&LayerID=22538&PageTypeID=4&PageID=10198&Q=1964494354",
  "UNION": "https://qpublic.schneidercorp.com/Application.aspx?AppID=1067&LayerID=22538&PageTypeID=4&PageID=10198&Q=1964494354",
  "VOLUSIA": "https://www.vcpa.vcgov.org/",
  "WAKULLA": "https://qpublic.schneidercorp.com/Application.aspx?AppID=1067&LayerID=22538&PageTypeID=4&PageID=10198&Q=1964494354",
  "WALTON": "https://www.waltonpa.com/",
  "WASHINGTON": "https://qpublic.schneidercorp.com/Application.aspx?AppID=1067&LayerID=22538&PageTypeID=4&PageID=10198&Q=1964494354"
};

// Function to get county appraisal link
function getCountyAppraisalLink(countyName) {
  if (!countyName) return null;
  
  // Normalize county name (uppercase, remove extra spaces)
  const normalized = countyName.toString().toUpperCase().trim();
  
  // Try exact match first
  if (FLORIDA_COUNTIES[normalized]) {
    return FLORIDA_COUNTIES[normalized];
  }
  
  // Try with "SAINT" instead of "ST"
  if (normalized.startsWith("ST ")) {
    const saintVersion = normalized.replace("ST ", "SAINT ");
    if (FLORIDA_COUNTIES[saintVersion]) {
      return FLORIDA_COUNTIES[saintVersion];
    }
  }
  
  // Try with "ST" instead of "SAINT"
  if (normalized.startsWith("SAINT ")) {
    const stVersion = normalized.replace("SAINT ", "ST ");
    if (FLORIDA_COUNTIES[stVersion]) {
      return FLORIDA_COUNTIES[stVersion];
    }
  }
  
  return null;
}

