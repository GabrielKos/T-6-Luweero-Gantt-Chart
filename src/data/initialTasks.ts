import { WBSTask, WorkPackageStyle } from '../types';

export const WORK_PACKAGE_STYLES: Record<string, WorkPackageStyle> = {
  "Business Case Development": { bg: "bg-blue-500", border: "border-blue-600", light: "bg-blue-50", text: "text-blue-700" },
  "Corporate Formation & ESIA": { bg: "bg-purple-500", border: "border-purple-600", light: "bg-purple-50", text: "text-purple-700" },
  "Plant Design and Engineering Specifications of the Plant": { bg: "bg-teal-500", border: "border-teal-600", light: "bg-teal-50", text: "text-teal-700" },
  "Plant Design & Engineering": { bg: "bg-teal-500", border: "border-teal-600", light: "bg-teal-50", text: "text-teal-700" },
  "Technology Transfer Agreement": { bg: "bg-orange-500", border: "border-orange-600", light: "bg-orange-50", text: "text-orange-700" },
  "Construction, Tooling, and Furnishing of the Plant": { bg: "bg-amber-500", border: "border-amber-600", light: "bg-amber-50", text: "text-amber-700" },
  "Construction, Tooling, & Furnishing": { bg: "bg-amber-500", border: "border-amber-600", light: "bg-amber-50", text: "text-amber-700" },
  "Human Capital Development": { bg: "bg-pink-500", border: "border-pink-600", light: "bg-pink-50", text: "text-pink-700" }
};

export const DEFAULT_STYLE: WorkPackageStyle = { bg: "bg-slate-500", border: "border-slate-600", light: "bg-slate-50", text: "text-slate-700" };

export interface RawTaskItem {
  wp: string;
  act: string;
  lead: string;
  support: string;
  dl: string;
  dur: number;
}

export const RAW_INITIAL_TASKS: RawTaskItem[] = [
  // =========================================================================
  // JULY 2026 (Page 1)
  // =========================================================================
  { wp: "Business Case Development", act: "Develop the Business Case outline, methodology, and implementation plan.", lead: "Shibah", support: "Morgan, Owen", dl: "2026-07-10", dur: 9 },
  { wp: "Business Case Development", act: "Develop the Project Vision, Objectives, and Investment Thesis.", lead: "Morgan", support: "Gabriel, Elizabeth", dl: "2026-07-17", dur: 7 },
  { wp: "Business Case Development", act: "Develop the Strategic Direction, Problem Statement, and Policy & Regulatory Framework.", lead: "Morgan", support: "Shibah, Donald, Elizabeth", dl: "2026-07-20", dur: 10 },
  { wp: "Business Case Development", act: "Develop the Market Demand Assessment and Market Segmentation.", lead: "Shibah", support: "Druscilar, Malik", dl: "2026-07-24", dur: 14 },
  { wp: "Business Case Development", act: "Benchmark the Competitive Landscape and develop the Right-to-Win strategy.", lead: "Shibah", support: "Karen, Mukama", dl: "2026-07-15", dur: 14 },
  { wp: "Business Case Development", act: "Develop the Options Analysis and Multi-Criteria Decision Analysis (MCDA).", lead: "Shibah", support: "Druscilar, Malik", dl: "2026-07-22", dur: 10 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Develop the Plant Design Basis and Engineering Design Philosophy.", lead: "Shibah", support: "Gabriel, Renorah", dl: "2026-07-31", dur: 14 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Develop the Plant Design Brief.", lead: "Shibah", support: "Gabriel, Renorah", dl: "2026-07-24", dur: 14 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Develop the preliminary Site Master Plan.", lead: "Shibah", support: "Gabriel, Renorah", dl: "2026-07-31", dur: 20 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Develop the preliminary Production Process Flow and Material Flow.", lead: "Shibah", support: "Gabriel, Rodney", dl: "2026-07-31", dur: 20 },
  { wp: "Human Capital Development", act: "Develop the competency matrix and training requirements.", lead: "Shibah", support: "Karen, Malik", dl: "2026-07-20", dur: 14 },
  { wp: "Human Capital Development", act: "Develop the Battery Team Training Plan for FY2026/27", lead: "Entire Project Team", support: "All Members", dl: "2026-07-27", dur: 14 },

  // =========================================================================
  // AUGUST 2026 (Page 2)
  // =========================================================================
  { wp: "Business Case Development", act: "Develop the Technology Selection and Chemistry Roadmap.", lead: "Shibah", support: "Druscilar, Mukama", dl: "2026-08-07", dur: 14 },
  { wp: "Business Case Development", act: "Develop the Plant Design and Production Capacity chapter.", lead: "Shibah", support: "Renorah, Gabriel", dl: "2026-08-12", dur: 14 },
  { wp: "Business Case Development", act: "Develop the Digital Architecture and Smart Manufacturing Framework.", lead: "Shibah", support: "Gabriel, Malik", dl: "2026-08-15", dur: 14 },
  { wp: "Business Case Development", act: "Develop the Upstream Sourcing Strategy.", lead: "Shibah", support: "Karen, Mukama", dl: "2026-08-18", dur: 14 },
  { wp: "Business Case Development", act: "Develop the Geopolitical and Sourcing Risk Management Strategy.", lead: "Shibah", support: "Karen, Malik", dl: "2026-08-20", dur: 14 },
  { wp: "Business Case Development", act: "Develop the Offtake and Go-to-Market Strategy.", lead: "Morgan", support: "Elizabeth", dl: "2026-08-22", dur: 14 },
  { wp: "Business Case Development", act: "Develop the Capital Expenditure (CAPEX) and Operating Expenditure (OPEX) Model.", lead: "Shibah", support: "Morgan, Owen, Renorah, Gabriel, Malik, Elizabeth, Druscilar", dl: "2026-08-24", dur: 20 },
  { wp: "Business Case Development", act: "Develop the Financial Performance and Valuation Model (NPV, IRR, Cash Flow, WACC).", lead: "Morgan", support: "Elizabeth", dl: "2026-08-28", dur: 14 },
  { wp: "Business Case Development", act: "Develop the Sensitivity Analysis and Capital Structure & Funding Strategy.", lead: "Morgan", support: "Elizabeth", dl: "2026-08-31", dur: 14 },
  { wp: "Business Case Development", act: "Develop the Sustainability, ESG, and Circular Economy Framework.", lead: "Owen", support: "Druscilar, Malik, Renorah, Elizabeth", dl: "2026-08-31", dur: 14 },
  { wp: "Corporate Formation & ESIA", act: "Commence land formalization and establish the legal framework for land allocation.", lead: "Donald", support: "Morgan, Shibah", dl: "2026-08-15", dur: 14 },
  { wp: "Corporate Formation & ESIA", act: "Select and reserve the Joint Venture (JV) name and Logo.", lead: "Donald", support: "Morgan, Shibah, Owen, Renorah", dl: "2026-08-18", dur: 14 },
  { wp: "Corporate Formation & ESIA", act: "Develop the Statements of Requirements (SoRs) and Terms of Reference (ToRs) for the ESIA Consultant.", lead: "Owen", support: "Gabriel, Renorah", dl: "2026-08-31", dur: 20 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Develop the preliminary Production Facility layout.", lead: "Shibah", support: "Gabriel, Renorah, Rodney", dl: "2026-08-07", dur: 14 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Develop the preliminary layout for the Quality Inspection & Testing Center.", lead: "Shibah", support: "Owen, Renorah, Gabriel", dl: "2026-08-12", dur: 14 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Develop the preliminary Inbound and Outbound Warehouse layouts.", lead: "Shibah", support: "Renorah, Gabriel, Mukama", dl: "2026-08-18", dur: 14 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Develop preliminary layouts for the Administration Building, Guest House, and Staff Residential.", lead: "Shibah", support: "Renorah", dl: "2026-08-22", dur: 14 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Develop the Statements of Requirements (SoRs) for the Design Consultant.", lead: "Shibah", support: "Renorah, Karen, Gabriel, Elizabeth", dl: "2026-08-27", dur: 14 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Develop the Terms of Reference (ToRs) for the Design Consultant procurement.", lead: "Shibah", support: "Gabriel, Karen, Renorah", dl: "2026-08-31", dur: 14 },
  { wp: "Human Capital Development", act: "Enroll in the Battery Management Systems and Pack Design Program.", lead: "Druscilar", support: "Karen, Mukama", dl: "2026-08-08", dur: 7 },
  { wp: "Human Capital Development", act: "Enroll in the Battery Management Systems Specialist Training Program.", lead: "Malik", support: "None", dl: "2026-08-15", dur: 7 },
  { wp: "Human Capital Development", act: "Enroll in the Diploma in Environmental, Social and Governance (ESG).", lead: "Owen", support: "None", dl: "2026-08-22", dur: 7 },
  { wp: "Human Capital Development", act: "Continue the Chartered Financial Analyst (CFA) certification", lead: "Morgan", support: "None", dl: "2026-08-31", dur: 30 },

  // =========================================================================
  // SEPTEMBER 2026 (Page 3)
  // =========================================================================
  { wp: "Business Case Development", act: "Develop the Project Governance Framework.", lead: "Morgan", support: "Druscilar, Mukama", dl: "2026-09-05", dur: 14 },
  { wp: "Business Case Development", act: "Develop the Project Implementation Roadmap and Gantt Chart.", lead: "Shibah", support: "Renorah, Gabriel", dl: "2026-09-10", dur: 14 },
  { wp: "Business Case Development", act: "Develop the Workforce Excellence and Skills Development Strategy.", lead: "Shibah", support: "Gabriel, Karen", dl: "2026-09-12", dur: 14 },
  { wp: "Business Case Development", act: "Develop the Corporate Formation and Corporate Architecture Framework.", lead: "Morgan", support: "Shibah, Elizabeth", dl: "2026-09-15", dur: 14 },
  { wp: "Business Case Development", act: "Develop the Project Risk Register and Risk Management Framework.", lead: "Owen", support: "Karen", dl: "2026-09-17", dur: 14 },
  { wp: "Business Case Development", act: "Develop the Battery Health, Safety, and Environmental (HSE) Framework.", lead: "Owen", support: "Gabriel", dl: "2026-09-20", dur: 14 },
  { wp: "Business Case Development", act: "Develop the Regulatory Compliance and Certification Roadmap.", lead: "Owen", support: "Gabriel", dl: "2026-09-22", dur: 14 },
  { wp: "Business Case Development", act: "Consolidate Draft Business Case and conduct an internal technical review", lead: "Entire Project Team", support: "All Members", dl: "2026-09-26", dur: 10 },
  { wp: "Business Case Development", act: "Present the Draft Business Case to the key stakeholders for review and guidance.", lead: "Shibah", support: "Morgan, Owen", dl: "2026-09-30", dur: 5 },
  { wp: "Corporate Formation & ESIA", act: "Commence trademark and intellectual property (IP) registration for the Joint Venture.", lead: "Donald", support: "Morgan, Shibah", dl: "2026-09-18", dur: 14 },
  { wp: "Corporate Formation & ESIA", act: "Evaluate bids and award the contract to the preferred ESIA Consultant.", lead: "Donald", support: "Owen, Shibah, Morgan", dl: "2026-09-20", dur: 14 },
  { wp: "Corporate Formation & ESIA", act: "Conduct the ESIA inception meeting and approve the Consultant's work program.", lead: "Donald", support: "Owen, Shibah, Morgan", dl: "2026-09-30", dur: 10 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Prepare the Design Consultant procurement documentation.", lead: "Shibah", support: "Elizabeth", dl: "2026-09-08", dur: 14 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Evaluate the technical proposals.", lead: "Shibah", support: "Owen, Gabriel, Renorah, Karen", dl: "2026-09-18", dur: 10 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Evaluate the financial proposals and negotiate with the preferred consultant.", lead: "Shibah", support: "Morgan, Donald", dl: "2026-09-25", dur: 7 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Award the Design Consultancy Contract and mobilize the Consultant.", lead: "Shibah", support: "Donald", dl: "2026-09-30", dur: 5 },
  { wp: "Construction, Tooling, and Furnishing of the Plant", act: "Develop the Statements of Requirements (SoRs) for the Early Works Contractor.", lead: "Shibah", support: "Renorah, Elizabeth", dl: "2026-09-08", dur: 14 },
  { wp: "Construction, Tooling, and Furnishing of the Plant", act: "Develop the Terms of Reference (ToRs) and procurement documentation for the Early Works Contractor.", lead: "Shibah", support: "Renorah, Donald", dl: "2026-09-15", dur: 14 },
  { wp: "Construction, Tooling, and Furnishing of the Plant", act: "Evaluate bids and negotiate with the preferred Early Works Contractor.", lead: "Shibah", support: "Morgan, Elizabeth, Donald", dl: "2026-09-25", dur: 10 },
  { wp: "Construction, Tooling, and Furnishing of the Plant", act: "Award the Early Works Contract and mobilize the Contractor.", lead: "Shibah", support: "Morgan, Donald", dl: "2026-09-30", dur: 5 },
  { wp: "Human Capital Development", act: "Complete the Battery Management Systems and Pack Design Program.", lead: "Druscilar", support: "Karen, Mukama", dl: "2026-09-30", dur: 30 },
  { wp: "Human Capital Development", act: "Complete the Battery Management Systems Specialist Training Program.", lead: "Malik", support: "None", dl: "2026-09-30", dur: 30 },
  { wp: "Human Capital Development", act: "Continue in the Diploma in Environmental, Social and Governance (ESG).", lead: "Owen", support: "None", dl: "2026-09-30", dur: 30 },
  { wp: "Human Capital Development", act: "Continue the Chartered Financial Analyst (CFA) certification", lead: "Morgan", support: "None", dl: "2026-09-30", dur: 30 },

  // =========================================================================
  // OCTOBER 2026 (Page 4)
  // =========================================================================
  { wp: "Business Case Development", act: "Present the Draft Business Case to strategic partners (LIL, NEC and other stakeholders) and incorporate comments.", lead: "Shibah", support: "Morgan, Donald", dl: "2026-10-07", dur: 7 },
  { wp: "Business Case Development", act: "Present the Draft Business Case to the KMC Senior Management Team for review.", lead: "Shibah", support: "Morgan", dl: "2026-10-10", dur: 7 },
  { wp: "Business Case Development", act: "Incorporate comments from strategic partners.", lead: "Shibah", support: "Morgan, Elizabeth, Owen", dl: "2026-10-17", dur: 7 },
  { wp: "Business Case Development", act: "Prepare, print and bind the Final Battery Plant Business Case.", lead: "Shibah", support: "Morgan", dl: "2026-10-24", dur: 7 },
  { wp: "Business Case Development", act: "Submit the Final Battery Pack Plant Business Case for Executive approval.", lead: "Shibah", support: "Morgan", dl: "2026-10-30", dur: 7 },
  { wp: "Corporate Formation & ESIA", act: "Prepare statutory registration documents for the project entity.", lead: "Donald", support: "Morgan, Elizabeth", dl: "2026-10-16", dur: 14 },
  { wp: "Corporate Formation & ESIA", act: "Commence the Environmental and Social Impact Assessment (ESIA).", lead: "Donald", support: "Owen, Shibah, Morgan", dl: "2026-10-30", dur: 20 },
  { wp: "Technology Transfer Agreement", act: "Identify and engage prospective technology partners for the Battery Plant.", lead: "Shibah", support: "Morgan, Owen", dl: "2026-10-10", dur: 10 },
  { wp: "Technology Transfer Agreement", act: "Conduct introductory engagements with prospective technology partners.", lead: "Shibah", support: "Morgan, Owen", dl: "2026-10-31", dur: 21 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Review and approve the Consultant's Design Work Plan and Design Program.", lead: "Entire Project Team", support: "All Members", dl: "2026-10-07", dur: 7 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Review the detailed Site Master Plan and General Arrangement Layout.", lead: "Shibah", support: "Owen, Renorah, Gabriel", dl: "2026-10-15", dur: 14 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Review the Production Facility and Manufacturing Process designs.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Druscilar", dl: "2026-10-31", dur: 20 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Conduct multidisciplinary engineering design discussions.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2026-10-31", dur: 20 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Consolidate engineering review comments and issues to the Design Consultant.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2026-10-31", dur: 10 },
  { wp: "Construction, Tooling, and Furnishing of the Plant", act: "Develop the Site Office and Perimeter Fence Layout and Drawings.", lead: "Shibah", support: "Renorah, Gabriel, Karen, Malik", dl: "2026-10-07", dur: 7 },
  { wp: "Construction, Tooling, and Furnishing of the Plant", act: "Review and approve the Early Works Design and Engineering package.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2026-10-10", dur: 10 },
  { wp: "Construction, Tooling, and Furnishing of the Plant", act: "Extend the electrical power and water supply network to the project site.", lead: "Shibah", support: "Gabriel, Rodney, Mukama, Druscilar, Renorah", dl: "2026-10-17", dur: 14 },
  { wp: "Construction, Tooling, and Furnishing of the Plant", act: "Commence construction of the temporary Site Offices and Perimeter Fence.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2026-10-31", dur: 20 },
  { wp: "Human Capital Development", act: "Enroll in the Battery Technologies Specialization.", lead: "Druscilar", support: "Karen, Mukama", dl: "2026-10-10", dur: 10 },
  { wp: "Human Capital Development", act: "Enroll in the EV Battery Pack Design and BMS Protection Modeling Certification.", lead: "Malik", support: "None", dl: "2026-10-17", dur: 10 },
  { wp: "Human Capital Development", act: "Enroll for the Systems Engineering Certification.", lead: "Shibah", support: "None", dl: "2026-10-24", dur: 10 },
  { wp: "Human Capital Development", act: "Continue the Chartered Financial Analyst (CFA) certification.", lead: "Morgan", support: "None", dl: "2026-10-31", dur: 30 },

  // =========================================================================
  // NOVEMBER 2026 (Page 5)
  // =========================================================================
  { wp: "Corporate Formation & ESIA", act: "Commence incorporation of the project entity and statutory registration processes.", lead: "Donald", support: "Owen, Shibah, Morgan", dl: "2026-11-10", dur: 10 },
  { wp: "Corporate Formation & ESIA", act: "Develop the Shareholders' Agreement and Corporate Governance Framework.", lead: "Donald", support: "Owen, Shibah, Morgan", dl: "2026-11-13", dur: 10 },
  { wp: "Corporate Formation & ESIA", act: "Continue ESIA studies, stakeholder consultations, and public engagement meetings.", lead: "Donald", support: "Owen, Shibah, Morgan", dl: "2026-11-30", dur: 20 },
  { wp: "Corporate Formation & ESIA", act: "Prepare the Draft ESIA Report and Environmental & Social Management Plan.", lead: "Donald", support: "Owen, Shibah, Morgan", dl: "2026-11-30", dur: 20 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Review the Quality Inspection & Testing Center design.", lead: "Shibah", support: "Owen, Renorah, Malik, Rodney", dl: "2026-11-07", dur: 14 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Review the Inbound and Outbound Warehouse designs.", lead: "Shibah", support: "Renorah, Mukama, Gabriel", dl: "2026-11-14", dur: 14 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Review the Administration Building, Guest House, and Staff Residential designs.", lead: "Shibah", support: "Renorah, Karen", dl: "2026-11-21", dur: 14 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Review the Internal Roads, Utility Distribution Network, and Site Infrastructure designs.", lead: "Shibah", support: "Owen, Renorah, Druscilar, Rodney", dl: "2026-11-30", dur: 20 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Conduct multidisciplinary engineering design discussions.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2026-11-30", dur: 20 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Consolidate engineering review comments and issues to the Design Consultant.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2026-11-30", dur: 10 },
  { wp: "Technology Transfer Agreement", act: "Present the Battery Plant concept and technical requirements to prospective technology partners.", lead: "Shibah", support: "Morgan, Owen, Druscilar, Mukama, Gabriel", dl: "2026-11-14", dur: 14 },
  { wp: "Technology Transfer Agreement", act: "Commence technical and commercial discussions with prospective technology partners.", lead: "Shibah", support: "Morgan, Owen", dl: "2026-11-28", dur: 14 },
  { wp: "Construction, Tooling, and Furnishing of the Plant", act: "Construct the Perimeter Fence.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2026-11-10", dur: 15 },
  { wp: "Construction, Tooling, and Furnishing of the Plant", act: "Construct the Site Offices.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2026-11-18", dur: 20 },
  { wp: "Construction, Tooling, and Furnishing of the Plant", act: "Install ICT infrastructure.", lead: "Shibah", support: "Rodney, Mukama, Druscilar, Renorah", dl: "2026-11-30", dur: 15 },
  { wp: "Human Capital Development", act: "Continue the Battery Technologies Specialization.", lead: "Druscilar", support: "Karen, Mukama", dl: "2026-11-30", dur: 30 },
  { wp: "Human Capital Development", act: "Continue the EV Battery Pack Design and BMS Protection Modeling Certification.", lead: "Malik", support: "None", dl: "2026-11-30", dur: 30 },
  { wp: "Human Capital Development", act: "Continue the Systems Engineering Certification.", lead: "Shibah", support: "None", dl: "2026-11-30", dur: 30 },
  { wp: "Human Capital Development", act: "Continue the Chartered Financial Analyst (CFA) certification.", lead: "Morgan", support: "None", dl: "2026-11-30", dur: 30 },

  // =========================================================================
  // DECEMBER 2026 (Page 6)
  // =========================================================================
  { wp: "Corporate Formation & ESIA", act: "Complete land formalization and Joint Venture intellectual property registration.", lead: "Donald", support: "Owen, Shibah, Morgan", dl: "2026-12-10", dur: 10 },
  { wp: "Corporate Formation & ESIA", act: "Review and approve the Draft ESIA Report and Environmental & Social Management Plan.", lead: "Donald", support: "Owen, Shibah, Morgan", dl: "2026-12-15", dur: 10 },
  { wp: "Corporate Formation & ESIA", act: "Submit the Final ESIA Report to the National Environment Management Authority (NEMA) for approval.", lead: "Donald", support: "Owen, Shibah, Morgan", dl: "2026-12-20", dur: 10 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Review the Electrical Substation and Power Distribution designs.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen", dl: "2026-12-08", dur: 14 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Review the Water Supply, Wastewater, and Storm Water Management designs.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Malik", dl: "2026-12-15", dur: 14 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Review the ICT, Communications, and Security Systems designs.", lead: "Shibah", support: "Owen, Gabriel, Druscilar", dl: "2026-12-22", dur: 14 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Review the Fire Protection and Compressed Air System designs.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Mukama", dl: "2026-12-22", dur: 14 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Conduct multidisciplinary engineering design discussions.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2026-12-22", dur: 20 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Consolidate engineering review comments and issues to the Design Consultant.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2026-12-22", dur: 10 },
  { wp: "Technology Transfer Agreement", act: "Continue technical, commercial, and operational negotiations with shortlisted technology partners", lead: "Donald", support: "Shibah, Morgan, Owen", dl: "2026-12-12", dur: 14 },
  { wp: "Technology Transfer Agreement", act: "Review proposed production technologies, manufacturing processes, and equipment configurations.", lead: "Shibah", support: "Morgan, Owen, Druscilar, Mukama, Gabriel", dl: "2026-12-22", dur: 14 },
  { wp: "Technology Transfer Agreement", act: "Develop the draft Technology Transfer Agreement framework.", lead: "Donald", support: "Shibah, Morgan, Owen", dl: "2026-12-31", dur: 15 },
  { wp: "Construction, Tooling, and Furnishing of the Plant", act: "Install the solar power system for the site offices.", lead: "Shibah", support: "Rodney, Karen, Malik, Renorah", dl: "2026-12-10", dur: 14 },
  { wp: "Construction, Tooling, and Furnishing of the Plant", act: "Complete the Site Offices", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2026-12-17", dur: 14 },
  { wp: "Construction, Tooling, and Furnishing of the Plant", act: "Complete the Perimeter Fence", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2026-12-22", dur: 14 },
  { wp: "Human Capital Development", act: "Complete the Battery Technologies Specialization.", lead: "Druscilar", support: "Karen, Mukama", dl: "2026-12-22", dur: 22 },
  { wp: "Human Capital Development", act: "Complete the EV Battery Pack Design and BMS Protection Modeling Certification.", lead: "Malik", support: "None", dl: "2026-12-22", dur: 22 },
  { wp: "Human Capital Development", act: "Complete the Systems Engineering Certification.", lead: "Shibah", support: "None", dl: "2026-12-22", dur: 22 },
  { wp: "Human Capital Development", act: "Continue the Chartered Financial Analyst (CFA) certification.", lead: "Morgan", support: "None", dl: "2026-12-22", dur: 22 },

  // =========================================================================
  // JANUARY 2027 (Page 7)
  // =========================================================================
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Review the Civil Engineering drawings.", lead: "Shibah", support: "Owen, Renorah, Rodney, Druscilar, Mukama", dl: "2027-01-08", dur: 14 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Review the Structural Engineering drawings.", lead: "Shibah", support: "Owen, Renorah, Gabriel, Karen, Malik", dl: "2027-01-15", dur: 14 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Review the Mechanical Engineering drawings.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Renorah", dl: "2027-01-22", dur: 14 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Review the Electrical Engineering drawings.", lead: "Shibah", support: "Owen, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2027-01-31", dur: 14 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Conduct multidisciplinary engineering design discussions.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2027-01-31", dur: 20 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Consolidate engineering review comments and issues to the Design Consultant.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2027-01-31", dur: 10 },
  { wp: "Technology Transfer Agreement", act: "Continue negotiations with shortlisted technology partners on technical and commercial requirements.", lead: "Donald", support: "Shibah, Morgan, Owen", dl: "2027-01-12", dur: 14 },
  { wp: "Technology Transfer Agreement", act: "Review engineering data, software, equipment integration, and training proposals.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2027-01-24", dur: 14 },
  { wp: "Technology Transfer Agreement", act: "Evaluate technology partner proposals and recommend the preferred partner.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2027-01-31", dur: 14 },
  { wp: "Human Capital Development", act: "Identify and nominate eight (8) staff for the CATL Level 1&2 Battery SMR Certification", lead: "Shibah", support: "None", dl: "2027-01-15", dur: 14 },
  { wp: "Human Capital Development", act: "Prepare training schedules and prerequisite requirements for the CATL Level 1&2 Battery SMR Certification", lead: "Shibah", support: "None", dl: "2027-01-31", dur: 16 },
  { wp: "Human Capital Development", act: "Continue the Chartered Financial Analyst (CFA) certification.", lead: "Morgan", support: "None", dl: "2027-01-31", dur: 30 },

  // =========================================================================
  // FEBRUARY 2027 (Page 8)
  // =========================================================================
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Review the HVAC, Fire Protection, and Compressed Air System designs.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen", dl: "2027-02-07", dur: 14 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Review the ICT, SCADA, and Plant Communications designs.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Malik", dl: "2027-02-14", dur: 14 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Conduct multidisciplinary engineering design discussions.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2027-02-21", dur: 20 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Consolidate engineering review comments and issues to the Design Consultant.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2027-02-28", dur: 10 },
  { wp: "Technology Transfer Agreement", act: "Conduct technical, commercial, and legal due diligence on the preferred technology partner.", lead: "Donald", support: "Shibah, Morgan, Owen", dl: "2027-02-14", dur: 14 },
  { wp: "Technology Transfer Agreement", act: "Negotiate intellectual property, training, and technical support arrangements.", lead: "Donald", support: "Shibah, Morgan, Owen", dl: "2027-02-28", dur: 14 },
  { wp: "Human Capital Development", act: "Complete registration and planning for the CATL Level 1,2 & 3 Battery SMR Certification.", lead: "Shibah", support: "None", dl: "2027-02-14", dur: 14 },
  { wp: "Human Capital Development", act: "Enroll and Complete L1 CATL Battery SMR Certification for 8", lead: "Shibah", support: "Project Team (8 Staff)", dl: "2027-02-28", dur: 14 },
  { wp: "Human Capital Development", act: "Continue the Chartered Financial Analyst (CFA) certification.", lead: "Morgan", support: "None", dl: "2027-02-28", dur: 28 },

  // =========================================================================
  // MARCH 2027 (Page 8)
  // =========================================================================
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Complete multidisciplinary engineering design review.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2027-03-10", dur: 14 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Approve the Final Engineering Design Package.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2027-03-20", dur: 14 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Issue the Approved Plant Design and Engineering Specifications.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2027-03-31", dur: 14 },
  { wp: "Technology Transfer Agreement", act: "Conclude negotiations and agree on the principal commercial and technical terms of the Technology Transfer Agreement.", lead: "Donald", support: "Shibah, Morgan, Owen", dl: "2027-03-15", dur: 15 },
  { wp: "Technology Transfer Agreement", act: "Confirm the preferred technology partner and implementation approach.", lead: "Donald", support: "Shibah, Morgan, Owen", dl: "2027-03-31", dur: 16 },
  { wp: "Human Capital Development", act: "Complete the CATL Level 1–3 Battery SMR Certification for eight (8) staff.", lead: "Shibah", support: "Mukama, Malik", dl: "2027-03-25", dur: 25 },
  { wp: "Human Capital Development", act: "Continue the Chartered Financial Analyst (CFA) certification.", lead: "Morgan", support: "None", dl: "2027-03-31", dur: 31 },

  // =========================================================================
  // APRIL 2027 (Page 9)
  // =========================================================================
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Review and approve the Bills of Quantities (BoQs).", lead: "Shibah", support: "Renorah, Elizabeth", dl: "2027-04-10", dur: 14 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Review and validate the Engineering Cost Estimates.", lead: "Shibah", support: "Morgan, Elizabeth", dl: "2027-04-20", dur: 14 },
  { wp: "Technology Transfer Agreement", act: "Develop the draft Technology Transfer Agreement.", lead: "Donald", support: "Shibah, Morgan, Owen", dl: "2027-04-10", dur: 14 },
  { wp: "Technology Transfer Agreement", act: "Review and confirm technical schedules, implementation plan, and knowledge transfer program.", lead: "Donald", support: "Shibah, Morgan, Owen", dl: "2027-04-30", dur: 20 },
  { wp: "Construction, Tooling, and Furnishing of the Plant", act: "Develop the Construction Statements of Requirements", lead: "Shibah", support: "Renorah, Gabriel", dl: "2027-04-30", dur: 20 },
  { wp: "Construction, Tooling, and Furnishing of the Plant", act: "Develop the Construction Terms of Reference (ToRs).", lead: "Shibah", support: "Renorah, Donald", dl: "2027-04-30", dur: 20 },
  { wp: "Human Capital Development", act: "Enroll in the Algorithms for Battery Management Systems Specialization.", lead: "Mukama", support: "None", dl: "2027-04-10", dur: 10 },
  { wp: "Human Capital Development", act: "Enroll in the EV Battery Pack Design and BMS Protection Modeling Certification.", lead: "Malik", support: "None", dl: "2027-04-20", dur: 10 },
  { wp: "Human Capital Development", act: "Continue the Chartered Financial Analyst (CFA) certification.", lead: "Morgan", support: "None", dl: "2027-04-30", dur: 30 },

  // =========================================================================
  // MAY 2027 (Page 9)
  // =========================================================================
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Review and approve engineering design revisions arising from constructability.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2027-05-15", dur: 15 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Update the Plant Design and Engineering Specifications to reflect approved design changes.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2027-05-31", dur: 16 },
  { wp: "Technology Transfer Agreement", act: "Review and finalize the Technology Transfer Agreement with the preferred partner.", lead: "Donald", support: "Shibah, Morgan, Owen", dl: "2027-05-15", dur: 15 },
  { wp: "Technology Transfer Agreement", act: "Obtain internal technical, legal, and commercial approvals.", lead: "Donald", support: "Shibah, Morgan, Owen", dl: "2027-05-31", dur: 16 },
  { wp: "Construction, Tooling, and Furnishing of the Plant", act: "Prepare the Construction Procurement Documentation.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2027-05-10", dur: 10 },
  { wp: "Construction, Tooling, and Furnishing of the Plant", act: "Evaluate the technical proposals.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2027-05-25", dur: 15 },
  { wp: "Construction, Tooling, and Furnishing of the Plant", act: "Evaluate the financial proposals and negotiate with the preferred consultant.", lead: "Shibah", support: "Owen, Morgan, Elizabeth, Donald", dl: "2027-05-31", dur: 10 },
  { wp: "Human Capital Development", act: "Continue the Algorithms for Battery Management Systems Specialization.", lead: "Mukama", support: "None", dl: "2027-05-31", dur: 31 },
  { wp: "Human Capital Development", act: "Continue the EV Battery Pack Design and BMS Protection Modeling Certification.", lead: "Malik", support: "None", dl: "2027-05-31", dur: 31 },
  { wp: "Human Capital Development", act: "Continue the Chartered Financial Analyst (CFA) certification.", lead: "Morgan", support: "None", dl: "2027-05-31", dur: 31 },

  // =========================================================================
  // JUNE 2027 (Page 10)
  // =========================================================================
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Review and approve engineering design revisions arising from constructability.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2027-06-15", dur: 15 },
  { wp: "Plant Design and Engineering Specifications of the Plant", act: "Update the Plant Design and Engineering Specifications to reflect approved design changes.", lead: "Shibah", support: "Owen, Gabriel, Rodney, Karen, Malik, Mukama, Druscilar, Renorah", dl: "2027-06-30", dur: 15 },
  { wp: "Technology Transfer Agreement", act: "Obtain corporate approvals for execution of the Technology Transfer Agreement.", lead: "Donald", support: "Shibah, Morgan, Owen", dl: "2027-06-15", dur: 15 },
  { wp: "Technology Transfer Agreement", act: "Complete partner approvals and prepare the execution copies of the Technology Transfer Agreement.", lead: "Donald", support: "Shibah, Morgan, Owen", dl: "2027-06-25", dur: 10 },
  { wp: "Construction, Tooling, and Furnishing of the Plant", act: "Award the Construction Contract", lead: "Shibah", support: "Donald", dl: "2027-06-30", dur: 15 },
  { wp: "Human Capital Development", act: "Complete the Algorithms for Battery Management Systems Specialization.", lead: "Mukama", support: "None", dl: "2027-06-30", dur: 30 },
  { wp: "Human Capital Development", act: "Complete the EV Battery Pack Design and BMS Protection Modeling Certification.", lead: "Malik", support: "None", dl: "2027-06-30", dur: 30 },
  { wp: "Human Capital Development", act: "Continue the Chartered Financial Analyst (CFA) certification.", lead: "Morgan", support: "None", dl: "2027-06-30", dur: 30 }
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
  { name: "Rodney", role: "Process Flow Engineer", email: "rodney@radienergy.com" },
  { name: "Entire Project Team", role: "All Team Members", email: "team@radienergy.com" }
];
