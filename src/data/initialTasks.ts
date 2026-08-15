import { WBSTask, WorkPackageStyle } from '../types';

export const WORK_PACKAGE_STYLES: Record<string, WorkPackageStyle> = {
  "Business Case Development": { bg: "bg-blue-500", border: "border-blue-600", light: "bg-blue-50", text: "text-blue-700" },
  "Corporate Formation & ESIA": { bg: "bg-purple-500", border: "border-purple-600", light: "bg-purple-50", text: "text-purple-700" },
  "Plant Design & Engineering": { bg: "bg-teal-500", border: "border-teal-600", light: "bg-teal-50", text: "text-teal-700" },
  "Technology Transfer Agreement": { bg: "bg-orange-500", border: "border-orange-600", light: "bg-orange-50", text: "text-orange-700" },
  "Construction, Tooling, & Furnishing": { bg: "bg-amber-500", border: "border-amber-600", light: "bg-amber-50", text: "text-amber-700" },
  "Human Capital Development": { bg: "bg-pink-500", border: "border-pink-600", light: "bg-pink-50", text: "text-pink-700" }
};

export const DEFAULT_STYLE: WorkPackageStyle = { bg: "bg-slate-500", border: "border-slate-600", light: "bg-slate-50", text: "text-slate-700" };

export const RAW_INITIAL_TASKS = [
  // JULY 2026
  { wp: "Business Case Development", act: "Develop the Business Case outline, methodology", lead: "Shibah", support: "Morgan, Owen", dl: "2026-07-10", dur: 9 },
  { wp: "Business Case Development", act: "Develop Project Vision, Objectives", lead: "Morgan", support: "Gabriel, Elizabeth", dl: "2026-07-17", dur: 7 },
  { wp: "Business Case Development", act: "Develop Strategic Direction, Problem Statement", lead: "Morgan", support: "Shibah, Donald, Elizabeth", dl: "2026-07-20", dur: 10 },
  { wp: "Business Case Development", act: "Develop Market Demand Assessment", lead: "Shibah", support: "Druscilar, Malik", dl: "2026-07-24", dur: 14 },
  { wp: "Business Case Development", act: "Benchmark Competitive Landscape", lead: "Shibah", support: "Karen, Mukama", dl: "2026-07-15", dur: 14 },
  { wp: "Business Case Development", act: "Develop Options Analysis and MCDA", lead: "Shibah", support: "Druscilar, Malik", dl: "2026-07-22", dur: 10 },
  { wp: "Plant Design & Engineering", act: "Develop Plant Design Basis & Philosophy", lead: "Shibah", support: "Gabriel, Renorah", dl: "2026-07-31", dur: 14 },
  { wp: "Plant Design & Engineering", act: "Develop Plant Design Brief", lead: "Shibah", support: "Gabriel, Renorah", dl: "2026-07-24", dur: 14 },
  { wp: "Plant Design & Engineering", act: "Develop preliminary Site Master Plan", lead: "Shibah", support: "Gabriel, Renorah", dl: "2026-07-31", dur: 20 },
  { wp: "Plant Design & Engineering", act: "Develop preliminary Production Process Flow", lead: "Shibah", support: "Gabriel, Rodney", dl: "2026-07-31", dur: 20 },
  { wp: "Human Capital Development", act: "Develop competency matrix & training reqs", lead: "Owen", support: "Shibah, Malik", dl: "2026-07-20", dur: 19 },
  { wp: "Human Capital Development", act: "Develop Battery Team Training Plan FY26/27", lead: "Owen", support: "Karen", dl: "2026-07-27", dur: 14 },

  // AUGUST 2026
  { wp: "Business Case Development", act: "Develop Technology Selection Roadmap", lead: "Shibah", support: "Druscilar, Mukama", dl: "2026-08-07", dur: 14 },
  { wp: "Business Case Development", act: "Develop Plant Design/Capacity chapter", lead: "Shibah", support: "Renorah, Gabriel", dl: "2026-08-12", dur: 14 },
  { wp: "Business Case Development", act: "Develop Digital Architecture Framework", lead: "Shibah", support: "Gabriel, Malik", dl: "2026-08-15", dur: 14 },
  { wp: "Business Case Development", act: "Develop Upstream Sourcing Strategy", lead: "Shibah", support: "Karen, Mukama", dl: "2026-08-18", dur: 14 },
  { wp: "Business Case Development", act: "Develop Geopolitical Risk Mgmt Strategy", lead: "Shibah", support: "Karen, Malik", dl: "2026-08-20", dur: 14 },
  { wp: "Business Case Development", act: "Develop Offtake and Go-to-Market Strategy", lead: "Morgan", support: "Elizabeth", dl: "2026-08-22", dur: 14 },
  { wp: "Business Case Development", act: "Develop CAPEX and OPEX Model", lead: "Morgan", support: "Team", dl: "2026-08-24", dur: 20 },
  { wp: "Business Case Development", act: "Develop Financial Performance Model", lead: "Morgan", support: "Elizabeth", dl: "2026-08-28", dur: 14 },
  { wp: "Business Case Development", act: "Develop Sensitivity Analysis & Funding", lead: "Morgan", support: "Elizabeth", dl: "2026-08-31", dur: 14 },
  { wp: "Business Case Development", act: "Develop Sustainability & ESG Framework", lead: "Owen", support: "Druscilar, Renorah", dl: "2026-08-31", dur: 14 },
  { wp: "Corporate Formation & ESIA", act: "Commence land formalization & legal framework", lead: "Donald", support: "Morgan, Shibah", dl: "2026-08-15", dur: 14 },
  { wp: "Corporate Formation & ESIA", act: "Select and reserve JV name & Logo", lead: "Donald", support: "Morgan, Shibah, Owen", dl: "2026-08-18", dur: 14 },
  { wp: "Corporate Formation & ESIA", act: "Develop SoRs and ToRs for ESIA Consultant", lead: "Donald", support: "Owen, Gabriel, Renorah", dl: "2026-08-31", dur: 20 },
  { wp: "Plant Design & Engineering", act: "Develop preliminary Production Facility layout", lead: "Shibah", support: "Gabriel, Renorah", dl: "2026-08-07", dur: 14 },
  { wp: "Plant Design & Engineering", act: "Develop preliminary QA Center layout", lead: "Shibah", support: "Owen, Renorah", dl: "2026-08-12", dur: 14 },
  { wp: "Plant Design & Engineering", act: "Develop Warehouse layouts", lead: "Shibah", support: "Renorah, Gabriel", dl: "2026-08-18", dur: 14 },
  { wp: "Plant Design & Engineering", act: "Develop Admin, Guest House layouts", lead: "Shibah", support: "Renorah", dl: "2026-08-22", dur: 14 },
  { wp: "Plant Design & Engineering", act: "Develop SoRs for Design Consultant", lead: "Shibah", support: "Renorah, Karen", dl: "2026-08-27", dur: 14 },
  { wp: "Plant Design & Engineering", act: "Develop ToRs for Design Consultant", lead: "Shibah", support: "Gabriel, Karen", dl: "2026-08-31", dur: 14 },
  { wp: "Human Capital Development", act: "Enroll in BMS and Pack Design Program", lead: "Owen", support: "Druscilar, Karen, Mukama", dl: "2026-08-08", dur: 7 },
  { wp: "Human Capital Development", act: "Enroll in BMS Specialist Training", lead: "Owen", support: "Malik", dl: "2026-08-15", dur: 7 },
  { wp: "Human Capital Development", act: "Enroll in Diploma in ESG", lead: "Owen", support: "Team", dl: "2026-08-22", dur: 7 },
  { wp: "Human Capital Development", act: "Continue CFA certification", lead: "Morgan", support: "None", dl: "2026-08-31", dur: 30 },

  // SEPTEMBER 2026
  { wp: "Business Case Development", act: "Develop Project Governance Framework", lead: "Morgan", support: "Druscilar, Mukama", dl: "2026-09-05", dur: 14 },
  { wp: "Business Case Development", act: "Develop Implementation Roadmap & Gantt Chart", lead: "Shibah", support: "Renorah, Gabriel", dl: "2026-09-10", dur: 14 },
  { wp: "Business Case Development", act: "Develop Workforce Excellence Strategy", lead: "Shibah", support: "Gabriel, Karen", dl: "2026-09-12", dur: 14 },
  { wp: "Business Case Development", act: "Develop Corporate Architecture Framework", lead: "Morgan", support: "Shibah, Elizabeth", dl: "2026-09-15", dur: 14 },
  { wp: "Business Case Development", act: "Develop Project Risk Register", lead: "Owen", support: "Karen", dl: "2026-09-17", dur: 14 },
  { wp: "Business Case Development", act: "Develop HSE Framework", lead: "Owen", support: "Gabriel", dl: "2026-09-20", dur: 14 },
  { wp: "Business Case Development", act: "Develop Regulatory Compliance Roadmap", lead: "Owen", support: "Gabriel", dl: "2026-09-22", dur: 14 },
  { wp: "Business Case Development", act: "Consolidate Draft Business Case & internal review", lead: "Shibah", support: "Team", dl: "2026-09-26", dur: 10 },
  { wp: "Business Case Development", act: "Present Draft Business Case to key stakeholders", lead: "Shibah", support: "Morgan, Owen", dl: "2026-09-30", dur: 4 },
  { wp: "Corporate Formation & ESIA", act: "Commence IP registration for JV", lead: "Donald", support: "Morgan, Shibah", dl: "2026-09-18", dur: 14 },
  { wp: "Corporate Formation & ESIA", act: "Evaluate bids & award ESIA contract", lead: "Donald", support: "Owen, Shibah, Morgan", dl: "2026-09-20", dur: 14 },
  { wp: "Corporate Formation & ESIA", act: "ESIA inception meeting & work program", lead: "Donald", support: "Owen, Shibah", dl: "2026-09-30", dur: 10 },
  { wp: "Plant Design & Engineering", act: "Prepare Design Consultant procurement docs", lead: "Shibah", support: "Elizabeth", dl: "2026-09-08", dur: 14 },
  { wp: "Plant Design & Engineering", act: "Evaluate technical proposals", lead: "Shibah", support: "Team", dl: "2026-09-18", dur: 10 },
  { wp: "Plant Design & Engineering", act: "Evaluate financial proposals & negotiate", lead: "Shibah", support: "Morgan, Donald", dl: "2026-09-25", dur: 7 },
  { wp: "Plant Design & Engineering", act: "Award Design Contract & mobilize", lead: "Shibah", support: "Donald", dl: "2026-09-30", dur: 5 },
  
  // OCTOBER 2026
  { wp: "Business Case Development", act: "Present Draft BC to strategic partners", lead: "Shibah", support: "Morgan, Donald", dl: "2026-10-07", dur: 7 },
  { wp: "Business Case Development", act: "Submit Final BC for Executive approval", lead: "Shibah", support: "Morgan", dl: "2026-10-30", dur: 14 },
  { wp: "Corporate Formation & ESIA", act: "Commence ESIA", lead: "Donald", support: "Owen, Shibah", dl: "2026-10-30", dur: 14 },
  { wp: "Technology Transfer Agreement", act: "Engage prospective tech partners", lead: "Morgan", support: "Shibah, Owen", dl: "2026-10-31", dur: 20 },
  { wp: "Plant Design & Engineering", act: "Review detailed Site Master Plan", lead: "Shibah", support: "Team", dl: "2026-10-15", dur: 14 },
  { wp: "Construction, Tooling, & Furnishing", act: "Commence Site Offices & Perimeter Fence", lead: "Shibah", support: "Team", dl: "2026-10-31", dur: 20 },

  // NOVEMBER 2026
  { wp: "Corporate Formation & ESIA", act: "Commence incorporation of project entity", lead: "Donald", support: "Owen, Shibah", dl: "2026-11-10", dur: 14 },
  { wp: "Corporate Formation & ESIA", act: "Prepare Draft ESIA Report & ESMP", lead: "Donald", support: "Team", dl: "2026-11-30", dur: 25 },
  { wp: "Technology Transfer Agreement", act: "Commence technical & commercial tech discussions", lead: "Morgan", support: "Shibah, Owen", dl: "2026-11-28", dur: 14 },
  { wp: "Construction, Tooling, & Furnishing", act: "Construct Site Offices & Install ICT", lead: "Shibah", support: "Team", dl: "2026-11-30", dur: 20 },

  // DECEMBER 2026
  { wp: "Corporate Formation & ESIA", act: "Complete land formalization & JV IP", lead: "Donald", support: "Owen, Shibah", dl: "2026-12-10", dur: 14 },
  { wp: "Corporate Formation & ESIA", act: "Submit Final ESIA to NEMA", lead: "Donald", support: "Team", dl: "2026-12-20", dur: 14 },
  { wp: "Plant Design & Engineering", act: "Review Utilities & Infrastructure designs", lead: "Shibah", support: "Team", dl: "2026-12-22", dur: 20 },
  { wp: "Technology Transfer Agreement", act: "Develop draft Tech Transfer framework", lead: "Morgan", support: "Donald, Shibah, Owen", dl: "2026-12-31", dur: 15 },
  
  // JANUARY - JUNE 2027
  { wp: "Plant Design & Engineering", act: "Review Engineering Drawings (Civil/Structural/Mech/Elec)", lead: "Shibah", support: "Team", dl: "2027-01-31", dur: 30 },
  { wp: "Technology Transfer Agreement", act: "Evaluate & recommend preferred tech partner", lead: "Morgan", support: "Team", dl: "2027-01-31", dur: 20 },
  { wp: "Plant Design & Engineering", act: "Review HVAC, Fire, ICT, SCADA designs", lead: "Shibah", support: "Team", dl: "2027-02-28", dur: 28 },
  { wp: "Technology Transfer Agreement", act: "Conduct due diligence on tech partner", lead: "Morgan", support: "Donald, Shibah", dl: "2027-02-14", dur: 14 },
  { wp: "Plant Design & Engineering", act: "Issue Approved Plant Design & Engineering Specs", lead: "Shibah", support: "Team", dl: "2027-03-31", dur: 20 },
  { wp: "Technology Transfer Agreement", act: "Agree on principal terms of Tech Transfer", lead: "Morgan", support: "Donald, Shibah, Owen", dl: "2027-03-15", dur: 14 },
  { wp: "Plant Design & Engineering", act: "Review and Validate Engineering BoQs/Cost", lead: "Shibah", support: "Morgan, Elizabeth", dl: "2027-04-20", dur: 20 },
  { wp: "Construction, Tooling, & Furnishing", act: "Develop Construction SoRs/ToRs", lead: "Shibah", support: "Renorah, Gabriel, Donald", dl: "2027-04-30", dur: 20 },
  { wp: "Plant Design & Engineering", act: "Update Plant Design based on constructability", lead: "Shibah", support: "Team", dl: "2027-05-31", dur: 15 },
  { wp: "Technology Transfer Agreement", act: "Finalize Tech Transfer Agreement", lead: "Morgan", support: "Donald, Shibah, Owen", dl: "2027-05-15", dur: 15 },
  { wp: "Construction, Tooling, & Furnishing", act: "Evaluate proposals & negotiate with contractor", lead: "Shibah", support: "Team", dl: "2027-05-31", dur: 20 },
  { wp: "Technology Transfer Agreement", act: "Execute Technology Transfer Agreement", lead: "Morgan", support: "Donald, Shibah, Owen", dl: "2027-06-25", dur: 15 },
  { wp: "Construction, Tooling, & Furnishing", act: "Award Construction Contract", lead: "Shibah", support: "Donald", dl: "2027-05-31", dur: 10 },
  { wp: "Human Capital Development", act: "Complete specialized battery certifications", lead: "Owen", support: "Team", dl: "2027-05-31", dur: 30 }
];

export function generateSeedTasks(): WBSTask[] {
  return RAW_INITIAL_TASKS.map((t, index) => {
    const end = new Date(`${t.dl}T00:00:00`);
    const start = new Date(end.getTime() - (t.dur * 24 * 60 * 60 * 1000));
    return {
      id: `T${index + 1}`,
      wp: t.wp,
      activity: t.act,
      lead: t.lead,
      support: t.support,
      deadline: t.dl,
      startMs: start.getTime(),
      endMs: end.getTime(),
      status: "PENDING",
      durationDays: t.dur,
      priority: "MEDIUM",
      style: WORK_PACKAGE_STYLES[t.wp] || DEFAULT_STYLE
    };
  });
}

export const TEAM_MEMBERS = [
  { name: "Shibah", role: "Lead Engineer / Project Lead", email: "shibah@radienergy.com" },
  { name: "Morgan", role: "Business & Financial Strategy Lead", email: "morgan@radienergy.com" },
  { name: "Owen", role: "HSE & ESG Officer", email: "owen@radienergy.com" },
  { name: "Donald", role: "Legal & Corporate Formation Lead", email: "donald@radienergy.com" },
  { name: "Gabriel", role: "Digital Architecture & Tech Officer", email: "gabriel@radienergy.com" },
  { name: "Elizabeth", role: "Financial Modeling Officer", email: "elizabeth@radienergy.com" },
  { name: "Druscilar", role: "Market Research Specialist", email: "druscilar@radienergy.com" },
  { name: "Malik", role: "Geopolitical & Sourcing Specialist", email: "malik@radienergy.com" },
  { name: "Karen", role: "Competitive Intelligence Officer", email: "karen@radienergy.com" },
  { name: "Mukama", role: "Technical Analyst", email: "mukama@radienergy.com" },
  { name: "Renorah", role: "Plant Layout Specialist", email: "renorah@radienergy.com" },
  { name: "Rodney", role: "Process Flow Engineer", email: "rodney@radienergy.com" }
];
