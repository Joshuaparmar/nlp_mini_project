import type { AuditVerificationResult, CorrectedAnswerResult } from '../types/audit';

export interface SamplePreset {
  id: string;
  name: string;
  domain: string;
  originalAnswer: string;
  documentName: string;
  documentSize: number;
  documentPages: number;
  extractedText: string;
  description: string;
  verificationResult: AuditVerificationResult;
  correctionResult: CorrectedAnswerResult;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'clinical-empagliflozin',
    name: 'Clinical Trial: Empagliflozin in HFpEF',
    domain: 'Healthcare & Clinical Trials',
    description: 'AI answer regarding cardiovascular mortality and hospitalization reduction in HFpEF patients.',
    originalAnswer: `According to recent randomized controlled clinical trials, Empagliflozin 10 mg once daily demonstrates a 38% reduction in all-cause mortality among patients suffering from Heart Failure with Preserved Ejection Fraction (HFpEF).

Key findings include:
1. The EMPEROR-Preserved trial enrolled 5,988 patients and showed a statistically significant 21% relative risk reduction in the primary composite endpoint of cardiovascular death or hospitalization for heart failure (HR 0.79, 95% CI 0.69 to 0.90, p < 0.001).
2. The drug showed an immediate 45% decrease in serum creatinine within the first 48 hours of treatment across all adult cohorts.
3. Adverse event rates for symptomatic hypotension occurred in 28.4% of participants in the empagliflozin group compared to 2.1% in the placebo group.
4. Total hospitalizations for heart failure were reduced by 27% (407 in the empagliflozin group vs 541 in the placebo group, HR 0.73; 95% CI, 0.61 to 0.88).

Recommended dosage should be initiated at 25 mg twice daily and titrated up to 50 mg for patients with eGFR < 30 mL/min/1.73 m².`,
    documentName: 'EMPEROR-Preserved_NEJM_Trial_Report.pdf',
    documentSize: 2450000,
    documentPages: 14,
    extractedText: `The New England Journal of Medicine — Clinical Report
Study Title: Empagliflozin in Heart Failure with a Preserved Ejection Fraction (EMPEROR-Preserved)
Authors: S.D. Anker, J. Butler, G. Filippatos, et al.

[Page 1]
ABSTRACT:
Background: Sodium-glucose cotransporter 2 (SGLT2) inhibitors reduce the risk of hospitalization for heart failure in patients with heart failure and a reduced ejection fraction, but their effects in patients with a preserved ejection fraction are unclear.
Methods: In this double-blind trial, we randomly assigned 5988 patients with class II–IV heart failure and an ejection fraction of more than 40% to receive empagliflozin (10 mg once daily) or placebo, in addition to usual therapy. The primary outcome was a composite of cardiovascular death or hospitalization for heart failure.

[Page 2]
RESULTS:
Over a median of 26.2 months, a primary outcome event occurred in 415 of 2997 patients (13.8%) in the empagliflozin group and in 511 of 2991 patients (17.1%) in the placebo group (hazard ratio, 0.79; 95% confidence interval [CI], 0.69 to 0.90; P<0.001). This effect was mainly related to a lower risk of hospitalization for heart failure in the empagliflozin group. The total number of hospitalizations for heart failure was lower in the empagliflozin group than in the placebo group (407 vs. 541; hazard ratio, 0.73; 95% CI, 0.61 to 0.88; P<0.001).

[Page 3]
MORTALITY & SAFETY:
Empagliflozin did not significantly reduce all-cause mortality (hazard ratio, 1.00; 95% CI, 0.87 to 1.15) or cardiovascular death alone (hazard ratio, 0.91; 95% CI, 0.76 to 1.09).
Uncomplicated genital tract infections were reported more frequently with empagliflozin (2.2% vs. 0.7%). Symptomatic hypotension occurred in 6.6% of patients receiving empagliflozin vs 5.2% in the placebo group.
Initial eGFR dips were transient (approximately 2.5 to 3.0 mL/min/1.73 m² at week 4), with preserved long-term renal function slope.
Recommended therapeutic dosage in the trial protocol was strictly 10 mg orally once daily. Empagliflozin is not recommended for initiation when eGFR is below 20 mL/min/1.73 m².`,
    verificationResult: {
      auditId: 'audit-emp-001',
      verifiedAt: new Date().toISOString(),
      modelUsed: 'secondopinion-verifier-v1',
      summary: {
        totalClaims: 6,
        supportedCount: 2,
        refutedCount: 3,
        insufficientCount: 1,
        ambiguousCount: 0,
        hallucinationsCount: 2,
        logicalInconsistenciesCount: 1,
        unsafeRecommendationsCount: 1,
        overallStatus: 'critical_issues_found',
        truthfulnessScore: 33,
        averageConfidence: 0.96,
      },
      isSimulated: true,
      claims: [
        {
          id: 'claim-emp-1',
          claimNumber: 1,
          text: 'According to recent randomized controlled clinical trials, Empagliflozin 10 mg once daily demonstrates a 38% reduction in all-cause mortality among patients suffering from Heart Failure with Preserved Ejection Fraction (HFpEF).',
          startOffset: 0,
          endOffset: 228,
          verdict: 'refuted',
          errorCategory: 'hallucinated_fact',
          safetyRisk: 'critical',
          confidence: 0.97,
          confidenceCalibration: {
            score: 0.97,
            calibrationLevel: 'high_certainty',
            uncertaintyInterval: [0.94, 0.99],
            epistemicCaveat: 'Explicit negative evidence: Primary NEJM trial paper directly refutes all-cause mortality claims.',
          },
          reasoningCheck: {
            hasLogicalFlaw: true,
            flawType: 'unwarranted_generalization',
            explanation: 'Conflates composite cardiovascular risk reduction with an unobserved 38% all-cause survival benefit.',
          },
          explanation: 'Contradicted by Page 3 of the NEJM report. Empagliflozin did not significantly reduce all-cause mortality (hazard ratio 1.00; 95% CI, 0.87 to 1.15) or cardiovascular death alone (HR 0.91). The claimed 38% reduction is an AI hallucination.',
          supportingEvidence: [],
          contradictingEvidence: [
            {
              id: 'ev-emp-1',
              type: 'contradicting',
              text: 'Empagliflozin did not significantly reduce all-cause mortality (hazard ratio, 1.00; 95% CI, 0.87 to 1.15) or cardiovascular death alone (hazard ratio, 0.91; 95% CI, 0.76 to 1.09).',
              source: {
                documentId: 'doc-emperor-1',
                documentName: 'EMPEROR-Preserved_NEJM_Trial_Report.pdf',
                pageNumber: 3,
                section: 'Mortality & Safety Analysis',
                relevanceScore: 0.98,
              }
            }
          ],
          sourceReferences: [
            {
              documentId: 'doc-emperor-1',
              documentName: 'EMPEROR-Preserved_NEJM_Trial_Report.pdf',
              pageNumber: 3,
              section: 'Mortality & Safety Analysis',
              relevanceScore: 0.98,
            }
          ]
        },
        {
          id: 'claim-emp-2',
          claimNumber: 2,
          text: '1. The EMPEROR-Preserved trial enrolled 5,988 patients and showed a statistically significant 21% relative risk reduction in the primary composite endpoint of cardiovascular death or hospitalization for heart failure (HR 0.79, 95% CI 0.69 to 0.90, p < 0.001).',
          startOffset: 252,
          endOffset: 512,
          verdict: 'supported',
          errorCategory: 'none',
          safetyRisk: 'none',
          confidence: 0.99,
          confidenceCalibration: {
            score: 0.99,
            calibrationLevel: 'high_certainty',
            uncertaintyInterval: [0.98, 1.0],
            epistemicCaveat: 'Exact mathematical and semantic concordance with primary published trial text.',
          },
          reasoningCheck: {
            hasLogicalFlaw: false,
          },
          explanation: 'Directly verified against the NEJM trial report (Pages 1 & 2). 5,988 patients were randomly assigned, and the primary composite outcome demonstrated HR 0.79 (95% CI 0.69 to 0.90, P<0.001), which is an exact 21% relative risk reduction.',
          supportingEvidence: [
            {
              id: 'ev-emp-2',
              type: 'supporting',
              text: 'Over a median of 26.2 months, a primary outcome event occurred in 415 of 2997 patients (13.8%) in the empagliflozin group and in 511 of 2991 patients (17.1%) in the placebo group (hazard ratio, 0.79; 95% confidence interval [CI], 0.69 to 0.90; P<0.001).',
              source: {
                documentId: 'doc-emperor-1',
                documentName: 'EMPEROR-Preserved_NEJM_Trial_Report.pdf',
                pageNumber: 2,
                section: 'Results - Primary Outcome',
                relevanceScore: 0.99,
              }
            }
          ],
          contradictingEvidence: [],
          sourceReferences: [
            {
              documentId: 'doc-emperor-1',
              documentName: 'EMPEROR-Preserved_NEJM_Trial_Report.pdf',
              pageNumber: 2,
              section: 'Results - Primary Outcome',
              relevanceScore: 0.99,
            }
          ]
        },
        {
          id: 'claim-emp-3',
          claimNumber: 3,
          text: '2. The drug showed an immediate 45% decrease in serum creatinine within the first 48 hours of treatment across all adult cohorts.',
          startOffset: 513,
          endOffset: 641,
          verdict: 'insufficient_evidence',
          errorCategory: 'unsupported_claim',
          safetyRisk: 'moderate',
          confidence: 0.89,
          confidenceCalibration: {
            score: 0.89,
            calibrationLevel: 'moderate_certainty',
            uncertaintyInterval: [0.82, 0.93],
            epistemicCaveat: 'Absence of evidence in supplied PDF; trial publication measured week-4 eGFR slope, not 48-hr serum creatinine assays.',
          },
          reasoningCheck: {
            hasLogicalFlaw: true,
            flawType: 'non_sequitur',
            explanation: 'Infers unmeasured short-term laboratory biomarker dynamics from chronic eGFR trajectory data.',
          },
          explanation: 'The trial publication discusses 4-week transient eGFR dips, but contains no laboratory evaluations or pharmacokinetic assays tracking 48-hour serum creatinine levels. The claim cannot be verified from the provided sources.',
          insufficientReason: 'The supplied document does not contain hourly biomarker or creatinine panel measurements.',
          supportingEvidence: [],
          contradictingEvidence: [],
          sourceReferences: []
        },
        {
          id: 'claim-emp-4',
          claimNumber: 4,
          text: '3. Adverse event rates for symptomatic hypotension occurred in 28.4% of participants in the empagliflozin group compared to 2.1% in the placebo group.',
          startOffset: 642,
          endOffset: 794,
          verdict: 'refuted',
          errorCategory: 'hallucinated_fact',
          safetyRisk: 'moderate',
          confidence: 0.96,
          confidenceCalibration: {
            score: 0.96,
            calibrationLevel: 'high_certainty',
            uncertaintyInterval: [0.93, 0.98],
            epistemicCaveat: 'Quantitative contradiction against safety table.',
          },
          reasoningCheck: {
            hasLogicalFlaw: false,
          },
          explanation: 'Contradicted by trial safety metrics on Page 3. Actual symptomatic hypotension occurred in 6.6% of patients receiving empagliflozin vs 5.2% in placebo (not 28.4% vs 2.1%).',
          supportingEvidence: [],
          contradictingEvidence: [
            {
              id: 'ev-emp-4',
              type: 'contradicting',
              text: 'Symptomatic hypotension occurred in 6.6% of patients receiving empagliflozin vs 5.2% in the placebo group.',
              source: {
                documentId: 'doc-emperor-1',
                documentName: 'EMPEROR-Preserved_NEJM_Trial_Report.pdf',
                pageNumber: 3,
                section: 'Safety & Adverse Events',
                relevanceScore: 0.96,
              }
            }
          ],
          sourceReferences: [
            {
              documentId: 'doc-emperor-1',
              documentName: 'EMPEROR-Preserved_NEJM_Trial_Report.pdf',
              pageNumber: 3,
              section: 'Safety & Adverse Events',
              relevanceScore: 0.96,
            }
          ]
        },
        {
          id: 'claim-emp-5',
          claimNumber: 5,
          text: '4. Total hospitalizations for heart failure were reduced by 27% (407 in the empagliflozin group vs 541 in the placebo group, HR 0.73; 95% CI, 0.61 to 0.88).',
          startOffset: 795,
          endOffset: 953,
          verdict: 'supported',
          errorCategory: 'none',
          safetyRisk: 'none',
          confidence: 0.99,
          confidenceCalibration: {
            score: 0.99,
            calibrationLevel: 'high_certainty',
            uncertaintyInterval: [0.98, 1.0],
            epistemicCaveat: 'Verbatim alignment with trial outcome statistics.',
          },
          reasoningCheck: {
            hasLogicalFlaw: false,
          },
          explanation: 'Fully supported by Page 2 of the NEJM publication. Total heart failure hospitalizations were 407 vs 541 (hazard ratio 0.73; 95% CI, 0.61 to 0.88; P<0.001), representing a 27% reduction.',
          supportingEvidence: [
            {
              id: 'ev-emp-5',
              type: 'supporting',
              text: 'The total number of hospitalizations for heart failure was lower in the empagliflozin group than in the placebo group (407 vs. 541; hazard ratio, 0.73; 95% CI, 0.61 to 0.88; P<0.001).',
              source: {
                documentId: 'doc-emperor-1',
                documentName: 'EMPEROR-Preserved_NEJM_Trial_Report.pdf',
                pageNumber: 2,
                section: 'Secondary Outcomes',
                relevanceScore: 0.99,
              }
            }
          ],
          contradictingEvidence: [],
          sourceReferences: [
            {
              documentId: 'doc-emperor-1',
              documentName: 'EMPEROR-Preserved_NEJM_Trial_Report.pdf',
              pageNumber: 2,
              section: 'Secondary Outcomes',
              relevanceScore: 0.99,
            }
          ]
        },
        {
          id: 'claim-emp-6',
          claimNumber: 6,
          text: 'Recommended dosage should be initiated at 25 mg twice daily and titrated up to 50 mg for patients with eGFR < 30 mL/min/1.73 m².',
          startOffset: 955,
          endOffset: 1086,
          verdict: 'refuted',
          errorCategory: 'unsafe_recommendation',
          safetyRisk: 'critical',
          confidence: 0.98,
          confidenceCalibration: {
            score: 0.98,
            calibrationLevel: 'high_certainty',
            uncertaintyInterval: [0.96, 1.0],
            epistemicCaveat: 'Direct pharmacological contraindication identified in FDA/trial protocol.',
          },
          reasoningCheck: {
            hasLogicalFlaw: true,
            flawType: 'contradictory_premises',
            explanation: 'Recommends 2.5x to 5x supratherapeutic dosing for impaired renal clearance where initiation is strictly contraindicated.',
          },
          explanation: 'Contradicted by trial protocol on Page 3. Recommended therapeutic dosage was strictly 10 mg orally once daily. Furthermore, initiation is not recommended when eGFR is below 20 mL/min/1.73 m².',
          supportingEvidence: [],
          contradictingEvidence: [
            {
              id: 'ev-emp-6',
              type: 'contradicting',
              text: 'Recommended therapeutic dosage in the trial protocol was strictly 10 mg orally once daily. Empagliflozin is not recommended for initiation when eGFR is below 20 mL/min/1.73 m².',
              source: {
                documentId: 'doc-emperor-1',
                documentName: 'EMPEROR-Preserved_NEJM_Trial_Report.pdf',
                pageNumber: 3,
                section: 'Dosage Protocol',
                relevanceScore: 0.97,
              }
            }
          ],
          sourceReferences: [
            {
              documentId: 'doc-emperor-1',
              documentName: 'EMPEROR-Preserved_NEJM_Trial_Report.pdf',
              pageNumber: 3,
              section: 'Dosage Protocol',
              relevanceScore: 0.97,
            }
          ]
        }
      ]
    },
    correctionResult: {
      auditId: 'audit-emp-001',
      generatedAt: new Date().toISOString(),
      modelUsed: 'secondopinion-corrector-v1',
      wordCount: 174,
      correctedAnswer: `According to the EMPEROR-Preserved clinical trial published in The New England Journal of Medicine, Empagliflozin 10 mg once daily demonstrates a statistically significant 21% relative risk reduction in the primary composite endpoint of cardiovascular death or hospitalization for heart failure among patients with Heart Failure with Preserved Ejection Fraction (HFpEF) (HR 0.79, 95% CI 0.69 to 0.90, p < 0.001) [NEJM Report, Page 2].

Key verified findings include:
1. Total hospitalizations for heart failure were reduced by 27% (407 events in the empagliflozin group vs 541 in the placebo group; HR 0.73, 95% CI 0.61 to 0.88; p < 0.001) [Page 2].
2. Empagliflozin did not significantly reduce all-cause mortality (HR 1.00; 95% CI 0.87 to 1.15) or cardiovascular death alone (HR 0.91; 95% CI 0.76 to 1.09) [Page 3].
3. Adverse event rates for symptomatic hypotension occurred in 6.6% of participants in the empagliflozin group compared to 5.2% in the placebo group [Page 3].
4. The recommended trial dosage was strictly 10 mg orally once daily. Empagliflozin is not recommended for initiation when eGFR is below 20 mL/min/1.73 m² [Page 3].

Missing evidence note: The supplied supporting trial publication does not provide sufficient laboratory data to verify 48-hour serum creatinine changes.`,
      retainedClaims: [
        'EMPEROR-Preserved trial enrollment of 5,988 patients and 21% relative risk reduction in composite outcome (Claim C2).',
        'Total hospitalizations for heart failure reduced by 27% (407 vs 541 events, HR 0.73) (Claim C5).'
      ],
      correctedClaims: [
        {
          originalClaimNumber: 1,
          originalText: 'Empagliflozin 10 mg once daily demonstrates a 38% reduction in all-cause mortality',
          correctedText: 'Empagliflozin did not significantly reduce all-cause mortality (HR 1.00, 95% CI 0.87 to 1.15)',
          changeType: 'refuted_correction',
          citation: 'NEJM Report, Page 3 (Mortality & Safety)',
          reason: 'Trial data explicitly proves all-cause mortality was not significantly reduced. The claimed 38% reduction was an AI hallucination.'
        },
        {
          originalClaimNumber: 4,
          originalText: 'Adverse event rates for symptomatic hypotension occurred in 28.4% of participants',
          correctedText: 'Symptomatic hypotension occurred in 6.6% of patients receiving empagliflozin vs 5.2% in placebo',
          changeType: 'refuted_correction',
          citation: 'NEJM Report, Page 3 (Safety Table)',
          reason: 'Corrected false 28.4% rate to trial-reported 6.6% rate.'
        },
        {
          originalClaimNumber: 6,
          originalText: 'Recommended dosage should be initiated at 25 mg twice daily and titrated up to 50 mg for patients with eGFR < 30',
          correctedText: 'Recommended therapeutic dosage was strictly 10 mg once daily, not recommended when eGFR is below 20',
          changeType: 'refuted_correction',
          citation: 'NEJM Report, Page 3 (Dosage Protocol)',
          reason: 'Trial protocol explicitly evaluated 10 mg once daily with initiation contraindicated when eGFR < 20 mL/min/1.73 m².'
        }
      ],
      omittedClaims: [
        {
          originalClaimNumber: 3,
          originalText: 'The drug showed an immediate 45% decrease in serum creatinine within the first 48 hours of treatment',
          reason: 'Omitted due to lack of evidence. The supplied trial report evaluated eGFR slopes at week 4 but contains no 48-hour serum creatinine assay data.'
        }
      ],
      evidenceGaps: [
        '48-hour serum creatinine biomarker panels and short-term pharmacokinetic measurements.'
      ],
      sourceReferences: [
        {
          documentId: 'doc-emperor-1',
          documentName: 'EMPEROR-Preserved_NEJM_Trial_Report.pdf',
          pageNumber: 2,
          section: 'Primary Efficacy Outcomes'
        },
        {
          documentId: 'doc-emperor-1',
          documentName: 'EMPEROR-Preserved_NEJM_Trial_Report.pdf',
          pageNumber: 3,
          section: 'Mortality & Safety Analysis'
        }
      ],
      limitations: 'All corrections and assertions are strictly bounded by the supplied EMPEROR-Preserved NEJM report. No external clinical trials were incorporated.',
      isSimulated: true
    }
  },
  {
    id: 'legal-eu-ai-act',
    name: 'Regulatory: EU AI Act High-Risk Requirements',
    domain: 'Legal & Tech Compliance',
    description: 'AI summary of obligations for high-risk AI system providers under Regulation (EU) 2024/1689.',
    originalAnswer: `Under the EU AI Act (Regulation 2024/1689), high-risk AI system providers are exempt from maintaining continuous technical documentation if their annual turnover is under €10 million.

Providers must fulfill the following mandatory obligations:
1. Establish and maintain a continuous risk management system throughout the entire lifecycle of the high-risk AI system (Article 9).
2. Data governance practices must ensure that training, validation, and testing datasets are subject to data examination for possible biases (Article 10).
3. System logs must be automatically generated and maintained for a minimum mandatory retention period of 6 months (Article 12).
4. High-risk AI systems must achieve an audited 100% zero-error rate before CE marking approval can be granted.
5. Post-market monitoring systems must be documented and operational (Article 72).`,
    documentName: 'EU_AI_Act_Official_Journal_Extract.pdf',
    documentSize: 1820000,
    documentPages: 22,
    extractedText: `Official Journal of the European Union — Regulation (EU) 2024/1689 of the European Parliament and of the Council

[Page 12 - Chapter III: Obligations of Providers of High-Risk AI Systems]
Article 9: Risk Management System
1. A risk management system shall be established, implemented, documented and maintained in relation to high-risk AI systems.
2. The risk management system shall be understood as a continuous iterative process planned and run throughout the entire lifecycle of a high-risk AI system, requiring regular systematic review and updating.

[Page 15 - Article 10: Data and Data Governance]
2. Training, validation and testing datasets shall be subject to appropriate data governance and management practices. These practices shall concern in particular:
(f) examination in view of possible biases that are likely to affect the health and safety of persons, negatively impact fundamental rights or lead to discrimination prohibited by Union law.

[Page 18 - Article 11 & Article 12: Technical Documentation & Record-Keeping]
Article 11: The technical documentation of a high-risk AI system shall be drawn up before that system is placed on the market or put into service and kept up to date. SME providers and start-ups are subject to simplified documentation formats but are NOT exempt from the requirement.
Article 12(1): High-risk AI systems shall technically allow for the automatic recording of events ('logs') over the lifetime of the system.
Article 12(2): Providers shall keep logs for a period appropriate in light of the intended purpose, of at least six months, unless provided otherwise in applicable Union or national law.
Article 15: High-risk AI systems shall be designed and developed in such a way that they achieve an appropriate level of accuracy, robustness and cybersecurity; absolute zero error is not mandated by the Regulation.`,
    verificationResult: {
      auditId: 'audit-eu-ai-002',
      verifiedAt: new Date().toISOString(),
      modelUsed: 'secondopinion-verifier-v1',
      summary: {
        totalClaims: 5,
        supportedCount: 3,
        refutedCount: 1,
        insufficientCount: 0,
        ambiguousCount: 1,
        hallucinationsCount: 1,
        logicalInconsistenciesCount: 1,
        unsafeRecommendationsCount: 0,
        overallStatus: 'critical_issues_found',
        truthfulnessScore: 60,
        averageConfidence: 0.97,
      },
      isSimulated: true,
      claims: [
        {
          id: 'claim-eu-1',
          claimNumber: 1,
          text: 'Under the EU AI Act (Regulation 2024/1689), high-risk AI system providers are exempt from maintaining continuous technical documentation if their annual turnover is under €10 million.',
          startOffset: 0,
          endOffset: 174,
          verdict: 'ambiguous',
          errorCategory: 'unsupported_claim',
          safetyRisk: 'moderate',
          confidence: 0.91,
          confidenceCalibration: {
            score: 0.91,
            calibrationLevel: 'high_certainty',
            uncertaintyInterval: [0.86, 0.95],
            epistemicCaveat: 'Article 11 provides simplified templates for SMEs, but does not grant a total turnover exemption.',
          },
          reasoningCheck: {
            hasLogicalFlaw: true,
            flawType: 'unwarranted_generalization',
            explanation: 'Generalizes simplified compliance formats for SMEs into a blanket financial threshold exemption.',
          },
          isAmbiguous: true,
          ambiguityReason: 'Article 11 allows simplified documentation formats for SMEs, but explicitly states they are not completely exempt from documentation duties.',
          explanation: 'Ambiguous & partially contradicted: Article 11 provides simplified documentation templates for SMEs, but explicitly clarifies that startups and SMEs are NOT exempt from establishing technical documentation.',
          supportingEvidence: [],
          contradictingEvidence: [
            {
              id: 'ev-eu-1',
              type: 'contradicting',
              text: 'SME providers and start-ups are subject to simplified documentation formats but are NOT exempt from the requirement.',
              source: {
                documentId: 'doc-eu-1',
                documentName: 'EU_AI_Act_Official_Journal_Extract.pdf',
                pageNumber: 18,
                section: 'Article 11 Technical Documentation',
                relevanceScore: 0.94,
              }
            }
          ],
          sourceReferences: [
            {
              documentId: 'doc-eu-1',
              documentName: 'EU_AI_Act_Official_Journal_Extract.pdf',
              pageNumber: 18,
              section: 'Article 11',
              relevanceScore: 0.94,
            }
          ]
        },
        {
          id: 'claim-eu-2',
          claimNumber: 2,
          text: '1. Establish and maintain a continuous risk management system throughout the entire lifecycle of the high-risk AI system (Article 9).',
          startOffset: 235,
          endOffset: 369,
          verdict: 'supported',
          errorCategory: 'none',
          safetyRisk: 'none',
          confidence: 0.99,
          confidenceCalibration: {
            score: 0.99,
            calibrationLevel: 'high_certainty',
            uncertaintyInterval: [0.98, 1.0],
            epistemicCaveat: 'Literal regulatory mandate text confirmed.',
          },
          reasoningCheck: {
            hasLogicalFlaw: false,
          },
          explanation: 'Directly supported by Article 9(1) and 9(2). A continuous iterative risk management process is mandatory throughout the entire lifecycle.',
          supportingEvidence: [
            {
              id: 'ev-eu-2',
              type: 'supporting',
              text: 'The risk management system shall be understood as a continuous iterative process planned and run throughout the entire lifecycle of a high-risk AI system.',
              source: {
                documentId: 'doc-eu-1',
                documentName: 'EU_AI_Act_Official_Journal_Extract.pdf',
                pageNumber: 12,
                section: 'Article 9 Risk Management',
                relevanceScore: 0.99,
              }
            }
          ],
          contradictingEvidence: [],
          sourceReferences: [
            {
              documentId: 'doc-eu-1',
              documentName: 'EU_AI_Act_Official_Journal_Extract.pdf',
              pageNumber: 12,
              section: 'Article 9',
              relevanceScore: 0.99,
            }
          ]
        },
        {
          id: 'claim-eu-3',
          claimNumber: 3,
          text: '2. Data governance practices must ensure that training, validation, and testing datasets are subject to data examination for possible biases (Article 10).',
          startOffset: 370,
          endOffset: 524,
          verdict: 'supported',
          errorCategory: 'none',
          safetyRisk: 'none',
          confidence: 0.98,
          confidenceCalibration: {
            score: 0.98,
            calibrationLevel: 'high_certainty',
            uncertaintyInterval: [0.96, 1.0],
            epistemicCaveat: 'Exact statutory match in data governance provisions.',
          },
          reasoningCheck: {
            hasLogicalFlaw: false,
          },
          explanation: 'Supported by Article 10(2)(f). Training and testing data must be examined for possible biases affecting health, safety, or fundamental rights.',
          supportingEvidence: [
            {
              id: 'ev-eu-3',
              type: 'supporting',
              text: 'examination in view of possible biases that are likely to affect the health and safety of persons, negatively impact fundamental rights or lead to discrimination prohibited by Union law.',
              source: {
                documentId: 'doc-eu-1',
                documentName: 'EU_AI_Act_Official_Journal_Extract.pdf',
                pageNumber: 15,
                section: 'Article 10 Data Governance',
                relevanceScore: 0.98,
              }
            }
          ],
          contradictingEvidence: [],
          sourceReferences: [
            {
              documentId: 'doc-eu-1',
              documentName: 'EU_AI_Act_Official_Journal_Extract.pdf',
              pageNumber: 15,
              section: 'Article 10',
              relevanceScore: 0.98,
            }
          ]
        },
        {
          id: 'claim-eu-4',
          claimNumber: 4,
          text: '3. System logs must be automatically generated and maintained for a minimum mandatory retention period of 6 months (Article 12).',
          startOffset: 525,
          endOffset: 654,
          verdict: 'supported',
          errorCategory: 'none',
          safetyRisk: 'none',
          confidence: 0.99,
          confidenceCalibration: {
            score: 0.99,
            calibrationLevel: 'high_certainty',
            uncertaintyInterval: [0.97, 1.0],
            epistemicCaveat: 'Clear match against Article 12 log preservation duration.',
          },
          reasoningCheck: {
            hasLogicalFlaw: false,
          },
          explanation: 'Supported by Article 12(1) and 12(2). Logging capabilities must allow automatic recording of events with a minimum retention of at least six months.',
          supportingEvidence: [
            {
              id: 'ev-eu-4',
              type: 'supporting',
              text: 'Providers shall keep logs for a period appropriate in light of the intended purpose, of at least six months, unless provided otherwise.',
              source: {
                documentId: 'doc-eu-1',
                documentName: 'EU_AI_Act_Official_Journal_Extract.pdf',
                pageNumber: 18,
                section: 'Article 12 Record-Keeping',
                relevanceScore: 0.99,
              }
            }
          ],
          contradictingEvidence: [],
          sourceReferences: [
            {
              documentId: 'doc-eu-1',
              documentName: 'EU_AI_Act_Official_Journal_Extract.pdf',
              pageNumber: 18,
              section: 'Article 12',
              relevanceScore: 0.99,
            }
          ]
        },
        {
          id: 'claim-eu-5',
          claimNumber: 5,
          text: '4. High-risk AI systems must achieve an audited 100% zero-error rate before CE marking approval can be granted.',
          startOffset: 655,
          endOffset: 766,
          verdict: 'refuted',
          errorCategory: 'logical_inconsistency',
          safetyRisk: 'moderate',
          confidence: 0.97,
          confidenceCalibration: {
            score: 0.97,
            calibrationLevel: 'high_certainty',
            uncertaintyInterval: [0.94, 0.99],
            epistemicCaveat: 'Statute explicitly disclaims absolute zero-error standard.',
          },
          reasoningCheck: {
            hasLogicalFlaw: true,
            flawType: 'non_sequitur',
            explanation: 'Concludes that safety assurance requires mathematically zero error, which Article 15 explicitly rejects in favor of proportionate robustness.',
          },
          explanation: 'Contradicted by Article 15. The regulation mandates appropriate levels of accuracy, robustness, and cybersecurity; absolute zero-error is not required or realistic under the regulation.',
          supportingEvidence: [],
          contradictingEvidence: [
            {
              id: 'ev-eu-5',
              type: 'contradicting',
              text: 'High-risk AI systems shall be designed and developed in such a way that they achieve an appropriate level of accuracy, robustness and cybersecurity; absolute zero error is not mandated by the Regulation.',
              source: {
                documentId: 'doc-eu-1',
                documentName: 'EU_AI_Act_Official_Journal_Extract.pdf',
                pageNumber: 18,
                section: 'Article 15 Accuracy & Robustness',
                relevanceScore: 0.97,
              }
            }
          ],
          sourceReferences: [
            {
              documentId: 'doc-eu-1',
              documentName: 'EU_AI_Act_Official_Journal_Extract.pdf',
              pageNumber: 18,
              section: 'Article 15',
              relevanceScore: 0.97,
            }
          ]
        }
      ]
    },
    correctionResult: {
      auditId: 'audit-eu-ai-002',
      generatedAt: new Date().toISOString(),
      modelUsed: 'secondopinion-corrector-v1',
      wordCount: 162,
      correctedAnswer: `Under the EU AI Act (Regulation 2024/1689), high-risk AI system providers are subject to mandatory lifecycle obligations. SME providers and startups benefit from simplified technical documentation formats, but are not exempt from documentation requirements [Article 11, Page 18].

Providers must fulfill the following mandatory obligations:
1. Establish and maintain a continuous iterative risk management system throughout the entire lifecycle of the high-risk AI system (Article 9) [Page 12].
2. Implement data governance practices ensuring training, validation, and testing datasets are examined for possible biases affecting health, safety, or fundamental rights (Article 10) [Page 15].
3. Maintain automatically generated system logs for an appropriate duration of at least six months (Article 12) [Page 18].
4. Design and develop systems to achieve appropriate levels of accuracy, robustness, and cybersecurity, as absolute zero-error performance is not mandated (Article 15) [Page 18].
5. Implement post-market monitoring systems (Article 72).`,
      retainedClaims: [
        'Mandatory continuous risk management system throughout lifecycle under Article 9 (Claim C2).',
        'Data governance practices and bias examination under Article 10 (Claim C3).',
        'Automated log generation with at least 6-month retention under Article 12 (Claim C4).'
      ],
      correctedClaims: [
        {
          originalClaimNumber: 1,
          originalText: 'high-risk AI system providers are exempt from maintaining continuous technical documentation if turnover is under €10M',
          correctedText: 'SME providers benefit from simplified documentation formats, but are not exempt from technical documentation duties',
          changeType: 'ambiguity_resolution',
          citation: 'Regulation (EU) 2024/1689, Article 11, Page 18',
          reason: 'Clarified that Article 11 does not grant blanket turnover-based exemptions, but rather simplified compliance templates for SMEs.'
        },
        {
          originalClaimNumber: 5,
          originalText: 'High-risk AI systems must achieve an audited 100% zero-error rate before CE marking approval',
          correctedText: 'Systems must achieve an appropriate level of accuracy, robustness and cybersecurity; absolute zero-error is not mandated',
          changeType: 'refuted_correction',
          citation: 'Regulation (EU) 2024/1689, Article 15, Page 18',
          reason: 'Article 15 requires proportionate accuracy and robustness, not impossible 100% zero-error perfection.'
        }
      ],
      omittedClaims: [],
      evidenceGaps: [],
      sourceReferences: [
        {
          documentId: 'doc-eu-1',
          documentName: 'EU_AI_Act_Official_Journal_Extract.pdf',
          pageNumber: 12,
          section: 'Article 9 Risk Management'
        },
        {
          documentId: 'doc-eu-1',
          documentName: 'EU_AI_Act_Official_Journal_Extract.pdf',
          pageNumber: 15,
          section: 'Article 10 Data Governance'
        },
        {
          documentId: 'doc-eu-1',
          documentName: 'EU_AI_Act_Official_Journal_Extract.pdf',
          pageNumber: 18,
          section: 'Articles 11, 12, 15'
        }
      ],
      limitations: 'Limited strictly to Chapter III and articles extracted from Official Journal Regulation 2024/1689.',
      isSimulated: true
    }
  },
  {
    id: 'financial-nvidia-earnings',
    name: 'Equity & SEC Filing: NVIDIA Q3 AI Infrastructure',
    domain: 'Finance & Technology Equity',
    description: 'AI report auditing quarterly revenue, gross margins, invented ASIC contracts, and unhedged investment advice.',
    originalAnswer: `NVIDIA Corporation reported record fiscal Q3 revenue of $35.1 billion, driven by surging Hopper architecture demand and initial Blackwell production shipments.

Key audited disclosures include:
1. Data Center revenue reached $30.8 billion, representing a 112% increase year-over-year.
2. GAAP gross margins expanded to a record 82.5%, outperforming all prior consensus forecasts by 750 basis points.
3. The company finalized an exclusive, non-cancellable $12 billion multi-year ASIC co-development agreement with Apple Inc. for next-generation on-device silicon.
4. Q4 revenue guidance is projected at $37.5 billion, plus or minus 2%.
5. Because current Data Center growth is sustained above 100%, long-term gross margin compression is mathematically impossible, so institutional investors should eliminate stop-loss protections on all leveraged long positions.`,
    documentName: 'NVIDIA_Q3_FY25_Shareholder_Letter_and_10Q.pdf',
    documentSize: 1950000,
    documentPages: 16,
    extractedText: `NVIDIA CORPORATION — QUARTERLY REPORT PURSUANT TO SECTION 13 OR 15(d) OF THE SECURITIES EXCHANGE ACT OF 1934
For the quarterly period ended October 27, 2024 (Form 10-Q)

[Page 3 - Executive Financial Summary]
Revenue for the third quarter of fiscal year 2025 was $35.1 billion, up 17% from the previous quarter and up 94% from a year ago.
Data Center revenue was $30.8 billion, up 17% from the previous quarter and up 112% from a year ago.
Blackwell production shipments are scheduled to begin in the fourth quarter of fiscal 2025 and will continue to ramp into fiscal 2026.

[Page 4 - Gross Margin and Operating Expenses]
GAAP gross margin was 74.6% and non-GAAP gross margin was 75.0%, compared with 75.1% and 75.7%, respectively, in the second quarter of fiscal 2025. Gross margin declined sequentially primarily due to a mix shift toward new data center systems within Blackwell ramp preparations.

[Page 7 - Outlook for the Fourth Quarter of Fiscal 2025]
Revenue is expected to be $37.5 billion, plus or minus 2%.
GAAP and non-GAAP gross margins are expected to be 73.0% and 73.5%, respectively, plus or minus 50 basis points.

[Page 11 - Customer Commitments & Material Agreements]
No individual customer accounted for more than 10% of total revenue. No undisclosed multi-year custom ASIC development partnerships were entered into during the period. Forward-looking competitive risks include potential margin compression from advanced packaging constraints, wafer pricing, and competitive accelerator architectures.`,
    verificationResult: {
      auditId: 'audit-nvda-003',
      verifiedAt: new Date().toISOString(),
      modelUsed: 'secondopinion-verifier-v1',
      summary: {
        totalClaims: 5,
        supportedCount: 2,
        refutedCount: 3,
        insufficientCount: 0,
        ambiguousCount: 0,
        hallucinationsCount: 2,
        logicalInconsistenciesCount: 1,
        unsafeRecommendationsCount: 1,
        overallStatus: 'critical_issues_found',
        truthfulnessScore: 40,
        averageConfidence: 0.98,
      },
      isSimulated: true,
      claims: [
        {
          id: 'claim-nvda-1',
          claimNumber: 1,
          text: '1. Data Center revenue reached $30.8 billion, representing a 112% increase year-over-year.',
          startOffset: 191,
          endOffset: 283,
          verdict: 'supported',
          errorCategory: 'none',
          safetyRisk: 'none',
          confidence: 0.99,
          confidenceCalibration: {
            score: 0.99,
            calibrationLevel: 'high_certainty',
            uncertaintyInterval: [0.98, 1.0],
            epistemicCaveat: 'Direct 10-Q SEC filing alignment on Data Center segment.',
          },
          reasoningCheck: {
            hasLogicalFlaw: false,
          },
          explanation: 'Accurate and verified by Page 3 of Form 10-Q. Data Center revenue was exactly $30.8 billion, up 112% year-over-year.',
          supportingEvidence: [
            {
              id: 'ev-nvda-1',
              type: 'supporting',
              text: 'Data Center revenue was $30.8 billion, up 17% from the previous quarter and up 112% from a year ago.',
              source: {
                documentId: 'doc-nvda-1',
                documentName: 'NVIDIA_Q3_FY25_Shareholder_Letter_and_10Q.pdf',
                pageNumber: 3,
                section: 'Executive Financial Summary',
                relevanceScore: 0.99,
              }
            }
          ],
          contradictingEvidence: [],
          sourceReferences: [
            {
              documentId: 'doc-nvda-1',
              documentName: 'NVIDIA_Q3_FY25_Shareholder_Letter_and_10Q.pdf',
              pageNumber: 3,
              section: 'Executive Financial Summary',
              relevanceScore: 0.99,
            }
          ]
        },
        {
          id: 'claim-nvda-2',
          claimNumber: 2,
          text: '2. GAAP gross margins expanded to a record 82.5%, outperforming all prior consensus forecasts by 750 basis points.',
          startOffset: 284,
          endOffset: 399,
          verdict: 'refuted',
          errorCategory: 'hallucinated_fact',
          safetyRisk: 'moderate',
          confidence: 0.98,
          confidenceCalibration: {
            score: 0.98,
            calibrationLevel: 'high_certainty',
            uncertaintyInterval: [0.95, 1.0],
            epistemicCaveat: 'Explicit arithmetic discrepancy against audited income statement.',
          },
          reasoningCheck: {
            hasLogicalFlaw: false,
          },
          explanation: 'Contradicted by Form 10-Q (Page 4). GAAP gross margin was 74.6% (and non-GAAP was 75.0%), declining sequentially from 75.1%. The claimed 82.5% margin is a fabricated financial hallucination.',
          supportingEvidence: [],
          contradictingEvidence: [
            {
              id: 'ev-nvda-2',
              type: 'contradicting',
              text: 'GAAP gross margin was 74.6% and non-GAAP gross margin was 75.0%, compared with 75.1% and 75.7%, respectively, in the second quarter of fiscal 2025.',
              source: {
                documentId: 'doc-nvda-1',
                documentName: 'NVIDIA_Q3_FY25_Shareholder_Letter_and_10Q.pdf',
                pageNumber: 4,
                section: 'Gross Margin Analysis',
                relevanceScore: 0.98,
              }
            }
          ],
          sourceReferences: [
            {
              documentId: 'doc-nvda-1',
              documentName: 'NVIDIA_Q3_FY25_Shareholder_Letter_and_10Q.pdf',
              pageNumber: 4,
              section: 'Gross Margin Analysis',
              relevanceScore: 0.98,
            }
          ]
        },
        {
          id: 'claim-nvda-3',
          claimNumber: 3,
          text: '3. The company finalized an exclusive, non-cancellable $12 billion multi-year ASIC co-development agreement with Apple Inc. for next-generation on-device silicon.',
          startOffset: 400,
          endOffset: 563,
          verdict: 'refuted',
          errorCategory: 'hallucinated_fact',
          safetyRisk: 'critical',
          confidence: 0.99,
          confidenceCalibration: {
            score: 0.99,
            calibrationLevel: 'high_certainty',
            uncertaintyInterval: [0.97, 1.0],
            epistemicCaveat: 'Total absence in SEC Material Agreements disclosures; would trigger mandatory 8-K disclosure if real.',
          },
          reasoningCheck: {
            hasLogicalFlaw: true,
            flawType: 'unwarranted_generalization',
            explanation: 'Fabrication of non-existent multi-billion dollar partner contract.',
          },
          explanation: 'Complete fabrication. Page 11 of Form 10-Q explicitly states no undisclosed custom ASIC partnerships were entered into. A $12B material contract with Apple would have required an immediate Form 8-K filing.',
          supportingEvidence: [],
          contradictingEvidence: [
            {
              id: 'ev-nvda-3',
              type: 'contradicting',
              text: 'No undisclosed multi-year custom ASIC development partnerships were entered into during the period.',
              source: {
                documentId: 'doc-nvda-1',
                documentName: 'NVIDIA_Q3_FY25_Shareholder_Letter_and_10Q.pdf',
                pageNumber: 11,
                section: 'Material Agreements',
                relevanceScore: 0.99,
              }
            }
          ],
          sourceReferences: [
            {
              documentId: 'doc-nvda-1',
              documentName: 'NVIDIA_Q3_FY25_Shareholder_Letter_and_10Q.pdf',
              pageNumber: 11,
              section: 'Material Agreements',
              relevanceScore: 0.99,
            }
          ]
        },
        {
          id: 'claim-nvda-4',
          claimNumber: 4,
          text: '4. Q4 revenue guidance is projected at $37.5 billion, plus or minus 2%.',
          startOffset: 564,
          endOffset: 635,
          verdict: 'supported',
          errorCategory: 'none',
          safetyRisk: 'none',
          confidence: 0.99,
          confidenceCalibration: {
            score: 0.99,
            calibrationLevel: 'high_certainty',
            uncertaintyInterval: [0.98, 1.0],
            epistemicCaveat: 'Accurate verbatim projection from official Q4 outlook.',
          },
          reasoningCheck: {
            hasLogicalFlaw: false,
          },
          explanation: 'Verified by Page 7 Outlook. Q4 revenue expectation was quoted at $37.5 billion, plus or minus 2%.',
          supportingEvidence: [
            {
              id: 'ev-nvda-4',
              type: 'supporting',
              text: 'Revenue is expected to be $37.5 billion, plus or minus 2%.',
              source: {
                documentId: 'doc-nvda-1',
                documentName: 'NVIDIA_Q3_FY25_Shareholder_Letter_and_10Q.pdf',
                pageNumber: 7,
                section: 'Outlook Q4 FY25',
                relevanceScore: 0.99,
              }
            }
          ],
          contradictingEvidence: [],
          sourceReferences: [
            {
              documentId: 'doc-nvda-1',
              documentName: 'NVIDIA_Q3_FY25_Shareholder_Letter_and_10Q.pdf',
              pageNumber: 7,
              section: 'Outlook Q4 FY25',
              relevanceScore: 0.99,
            }
          ]
        },
        {
          id: 'claim-nvda-5',
          claimNumber: 5,
          text: '5. Because current Data Center growth is sustained above 100%, long-term gross margin compression is mathematically impossible, so institutional investors should eliminate stop-loss protections on all leveraged long positions.',
          startOffset: 636,
          endOffset: 864,
          verdict: 'refuted',
          errorCategory: 'unsafe_recommendation',
          safetyRisk: 'critical',
          confidence: 0.98,
          confidenceCalibration: {
            score: 0.98,
            calibrationLevel: 'high_certainty',
            uncertaintyInterval: [0.95, 1.0],
            epistemicCaveat: 'Identified combined logical non-sequitur and hazardous unhedged financial directive.',
          },
          reasoningCheck: {
            hasLogicalFlaw: true,
            flawType: 'non_sequitur',
            explanation: 'Non-sequitur and false causality: Topline revenue momentum does not preclude margin compression caused by packaging yields, foundry wafer pricing, or competitive pressure.',
          },
          explanation: 'Critical logical flaw & unsafe recommendation. Page 11 explicitly highlights margin compression risks. Recommending institutional traders remove downside stop-loss risk controls violates basic financial fiduciary standards.',
          supportingEvidence: [],
          contradictingEvidence: [
            {
              id: 'ev-nvda-5',
              type: 'contradicting',
              text: 'Forward-looking competitive risks include potential margin compression from advanced packaging constraints, wafer pricing, and competitive accelerator architectures.',
              source: {
                documentId: 'doc-nvda-1',
                documentName: 'NVIDIA_Q3_FY25_Shareholder_Letter_and_10Q.pdf',
                pageNumber: 11,
                section: 'Risk Factors',
                relevanceScore: 0.97,
              }
            }
          ],
          sourceReferences: [
            {
              documentId: 'doc-nvda-1',
              documentName: 'NVIDIA_Q3_FY25_Shareholder_Letter_and_10Q.pdf',
              pageNumber: 11,
              section: 'Risk Factors',
              relevanceScore: 0.97,
            }
          ]
        }
      ]
    },
    correctionResult: {
      auditId: 'audit-nvda-003',
      generatedAt: new Date().toISOString(),
      modelUsed: 'secondopinion-corrector-v1',
      wordCount: 168,
      correctedAnswer: `NVIDIA Corporation reported record fiscal Q3 revenue of $35.1 billion, up 94% year-over-year, driven by Data Center compute demand and Blackwell manufacturing ramp [Form 10-Q, Page 3].

Key verified financial findings include:
1. Data Center revenue reached $30.8 billion, representing a 112% year-over-year increase [Page 3].
2. GAAP gross margin was 74.6% (non-GAAP 75.0%), reflecting a sequential decrease from 75.1% due to initial system mix shifts rather than expanding to 82.5% [Page 4].
3. No Apple ASIC partnership agreement exists or was disclosed in the filing [Page 11].
4. Q4 revenue guidance is projected at $37.5 billion, plus or minus 2% [Page 7].
5. Long-term gross margins remain subject to packaging constraints, component costs, and competitive accelerator architectures as documented in statutory risk factors [Page 11].`,
      retainedClaims: [
        'Data Center revenue of $30.8B and 112% YoY growth (Claim C1).',
        'Q4 revenue guidance of $37.5B +/- 2% (Claim C4).'
      ],
      correctedClaims: [
        {
          originalClaimNumber: 2,
          originalText: 'GAAP gross margins expanded to a record 82.5%, outperforming all prior consensus forecasts by 750 basis points',
          correctedText: 'GAAP gross margin was 74.6% (non-GAAP 75.0%), declining sequentially from 75.1% due to mix shifts',
          changeType: 'refuted_correction',
          citation: 'Form 10-Q, Page 4 (Gross Margin Analysis)',
          reason: 'Corrected fabricated 82.5% figure to actual 74.6% GAAP gross margin.'
        },
        {
          originalClaimNumber: 3,
          originalText: 'finalized an exclusive, non-cancellable $12 billion multi-year ASIC co-development agreement with Apple Inc.',
          correctedText: 'No undisclosed custom ASIC development partnerships were entered into during the quarter',
          changeType: 'refuted_correction',
          citation: 'Form 10-Q, Page 11 (Material Agreements)',
          reason: 'Disproved fabricated multi-billion dollar Apple ASIC contract.'
        },
        {
          originalClaimNumber: 5,
          originalText: 'long-term gross margin compression is mathematically impossible, so eliminate stop-loss protections',
          correctedText: 'Gross margins remain subject to competitive pressure, packaging constraints, and wafer pricing risk factors',
          changeType: 'refuted_correction',
          citation: 'Form 10-Q, Page 11 (Statutory Risk Factors)',
          reason: 'Corrected logical non-sequitur and eliminated dangerous unhedged trading recommendation.'
        }
      ],
      omittedClaims: [],
      evidenceGaps: [],
      sourceReferences: [
        {
          documentId: 'doc-nvda-1',
          documentName: 'NVIDIA_Q3_FY25_Shareholder_Letter_and_10Q.pdf',
          pageNumber: 3,
          section: 'Executive Financial Summary'
        },
        {
          documentId: 'doc-nvda-1',
          documentName: 'NVIDIA_Q3_FY25_Shareholder_Letter_and_10Q.pdf',
          pageNumber: 4,
          section: 'Gross Margin'
        },
        {
          documentId: 'doc-nvda-1',
          documentName: 'NVIDIA_Q3_FY25_Shareholder_Letter_and_10Q.pdf',
          pageNumber: 11,
          section: 'Risk Factors'
        }
      ],
      limitations: 'Audit strictly grounded in NVIDIA Form 10-Q filed with the U.S. Securities and Exchange Commission for the period ended October 27, 2024.',
      isSimulated: true
    }
  }
];
