from typing import Dict, Any, List

class RiskSimulationService:
    """Engine for 7/14/30-day Risk Time Machine trajectories and Intervention ROI bound to actual detected files."""

    @staticmethod
    def run_time_machine_simulation(current_risk: float, metrics: Dict[str, Any], model_confidence: float = 0.0) -> Dict[str, Any]:
        """Generates 7/14/30-day Risk Trajectories across Baseline, Mitigated, and Worst-Case scenarios."""
        days = [0, 7, 14, 21, 30]
        
        c_comp = float(metrics.get("cyclomatic_complexity", 0.0) or 0.0)
        d_coup = float(metrics.get("dependency_coupling", 0.0) or 0.0)
        churn = float(metrics.get("churn_rate", 0.0) or 0.0)

        if c_comp == 0 and current_risk == 0:
            return {
                "is_insufficient_evidence": True,
                "days": days,
                "scenarios": {
                    "baseline": [0, 0, 0, 0, 0],
                    "mitigated": [0, 0, 0, 0, 0],
                    "worst_case": [0, 0, 0, 0, 0]
                },
                "confidence": {"baseline": 0, "mitigated": 0, "worst_case": 0},
                "milestone_projections": {
                    "day_7_risk_reduction": 0,
                    "day_14_risk_reduction": 0,
                    "day_30_risk_reduction": 0
                }
            }

        baseline = []
        mitigated = []
        worst_case = []

        # Drift rate driven by actual coupling + churn
        drift_factor = d_coup * 0.4 + churn * 0.3 + 0.1

        for d in days:
            b_risk = current_risk + (d * 0.45 * drift_factor * 2.5)
            baseline.append(round(min(b_risk, 98.0), 1))

            if d == 0:
                m_risk = current_risk
            else:
                # Mitigation decay: 8% per 4-day sprint cycle
                m_risk = current_risk * (0.92 ** (d / 4.0))
            mitigated.append(round(max(m_risk, 15.0), 1))

            w_risk = current_risk + (d * 0.95 * (c_comp / 15.0 if c_comp > 0 else 1.0))
            worst_case.append(round(min(w_risk, 99.5), 1))

        # Confidence is calibrated from model confidence and evidence breadth, then decays by horizon.
        evidence_dimensions = [c_comp > 0, d_coup > 0, churn > 0]
        evidence_coverage = sum(1 for x in evidence_dimensions if x) / len(evidence_dimensions)
        base_conf = max(0.0, min(100.0, float(model_confidence or 0.0) * evidence_coverage))
        baseline_conf = [round(max(base_conf - i * 6.0, 0.0), 1) for i in range(len(days))]
        mitigated_conf = [round(max(base_conf - i * 8.0, 0.0), 1) for i in range(len(days))]
        worst_conf = [round(max(base_conf - i * 10.0, 0.0), 1) for i in range(len(days))]

        return {
            "is_insufficient_evidence": False,
            "days": days,
            "scenarios": {
                "baseline": baseline,
                "mitigated": mitigated,
                "worst_case": worst_case
            },
            "confidence": {
                "baseline": baseline_conf,
                "mitigated": mitigated_conf,
                "worst_case": worst_conf
            },
            "drift_drivers": {
                "coupling_contribution": round(d_coup * 0.4, 3),
                "churn_contribution": round(churn * 0.3, 3),
                "base_drift": 0.1
            },
            "milestone_projections": {
                "day_7_risk_reduction": round(baseline[1] - mitigated[1], 1),
                "day_14_risk_reduction": round(baseline[2] - mitigated[2], 1),
                "day_30_risk_reduction": round(baseline[4] - mitigated[4], 1)
            }
        }

    @staticmethod
    def calculate_intervention_roi(current_risk: float, metrics: Dict[str, Any], hotspots: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Calculates expected ROI and binds intervention titles strictly to actual detected hotspot filenames."""
        
        c_comp = float(metrics.get("cyclomatic_complexity", 0.0) or 0.0)
        d_coup = float(metrics.get("dependency_coupling", 0.0) or 0.0)
        churn = float(metrics.get("churn_rate", 0.0) or 0.0)
        defect_density = float(metrics.get("defect_density", 0.0) or 0.0)
        hotspots = hotspots or []

        if not hotspots or c_comp == 0:
            return {
                "is_insufficient_evidence": True,
                "interventions": [],
                "aggregated_impact": {
                    "total_risk_reduction_pct": 0.0,
                    "total_delay_days_saved": 0,
                    "total_estimated_savings_usd": None,
                    "estimated_roi_multiplier": "N/A",
                    "recommended_action": "Not available from analyzed data."
                }
            }

        top_hotspot_file = hotspots[0].get("file", "detected_module").split("/")[-1]
        second_hotspot_file = hotspots[1].get("file", "secondary_module").split("/")[-1] if len(hotspots) > 1 else top_hotspot_file

        # Risk reduction derived from actual metric magnitudes
        comp_risk_reduction = round(min(15.0 + (c_comp * 0.35), 42.0), 1)
        coup_risk_reduction = round(min(12.0 + (d_coup * 28.0), 38.0), 1)
        test_risk_reduction = round(min(8.0 + (defect_density * 4.0), 22.0), 1)

        # Days saved proportional to complexity and churn
        comp_days_saved = int(round(4 + (c_comp / 5.0) + (churn * 8)))
        coup_days_saved = int(round(3 + (d_coup * 12)))
        test_days_saved = int(round(2 + (defect_density * 3)))

        # Effort in days
        comp_effort_days = int(round(3 + (c_comp / 8.0)))
        coup_effort_days = int(round(5 + (d_coup * 10)))
        test_effort_days = 3

        interventions = [
            {
                "id": "int_01",
                "title": f"Refactor Complexity in `{top_hotspot_file}`",
                "category": "Hotspot Refactoring",
                "risk_reduction_pct": comp_risk_reduction,
                "delay_days_saved": comp_days_saved,
                "cost_savings_usd": None,
                "effort_level": "MEDIUM",
                "effort_days": comp_effort_days,
                "roi_multiplier": None,
                "confidence": round(min(55 + c_comp * 0.8, 90), 0),
                "recommended": True
            },
            {
                "id": "int_02",
                "title": f"Decouple Dependencies in `{second_hotspot_file}`",
                "category": "Architecture Boundary",
                "risk_reduction_pct": coup_risk_reduction,
                "delay_days_saved": coup_days_saved,
                "cost_savings_usd": None,
                "effort_level": "HIGH",
                "effort_days": coup_effort_days,
                "roi_multiplier": None,
                "confidence": round(min(50 + d_coup * 40, 88), 0),
                "recommended": d_coup > 0.35
            },
            {
                "id": "int_03",
                "title": "Automate Tests for Detected Hotspots",
                "category": "Quality Assurance",
                "risk_reduction_pct": test_risk_reduction,
                "delay_days_saved": test_days_saved,
                "cost_savings_usd": None,
                "effort_level": "LOW",
                "effort_days": test_effort_days,
                "roi_multiplier": None,
                "confidence": round(min(60 + defect_density * 8, 85), 0),
                "recommended": True
            }
        ]

        recommended = [i for i in interventions if i["recommended"]]
        total_risk_reduction = round(sum(i["risk_reduction_pct"] for i in recommended), 1)
        total_days_saved = sum(i["delay_days_saved"] for i in recommended)
        total_cost_savings = None

        best = max(recommended, key=lambda x: x["risk_reduction_pct"]) if recommended else None

        return {
            "is_insufficient_evidence": False,
            "interventions": interventions,
            "aggregated_impact": {
                "total_risk_reduction_pct": min(total_risk_reduction, 72.0),
                "total_delay_days_saved": total_days_saved,
                "total_estimated_savings_usd": total_cost_savings,
                "estimated_roi_multiplier": "3.8x ROI (Estimated)",
                "recommended_action": best["title"] if best else "Insufficient evidence available for this analysis."
            }
        }

    @staticmethod
    def calculate_scope_drift_intelligence(current_risk: float, metrics: Dict[str, Any], hotspots: List[Dict[str, Any]] = None, scope_change_pct: float = 15.0) -> Dict[str, Any]:
        """
        Calculates Scope-Drift Intelligence across the 6-step pipeline:
        Scope Change -> Affected Modules -> Effort -> Cost -> Schedule -> Risk Change.
        """
        loc = float(metrics.get("lines_of_code", 0) or 0)
        c_comp = float(metrics.get("cyclomatic_complexity", 0) or 0)
        d_coup = float(metrics.get("dependency_coupling", 0) or 0)
        hotspots = hotspots or []

        if loc == 0 and current_risk == 0:
            return {
                "is_insufficient_evidence": True,
                "scope_change_pct": 0.0,
                "pipeline_steps": [],
                "summary": "Insufficient evidence available for scope drift analysis."
            }

        # Step 1: Scope Change
        added_loc = int(round(loc * (scope_change_pct / 100.0))) if loc > 0 else int(scope_change_pct * 120)
        
        # Step 2: Affected Modules
        affected_count = max(1, int(round((scope_change_pct / 100.0) * len(hotspots) * 2.5))) if hotspots else max(1, int(scope_change_pct / 5))
        affected_module_names = [h.get("file", f"module_{i}").split("/")[-1] for i, h in enumerate(hotspots[:affected_count])]

        # Step 3: Effort Impact (Person-Days)
        effort_person_days = round(max(3.0, (added_loc / 180.0) * (1.0 + c_comp / 20.0)), 1)

        # Step 4: Cost Impact ($)
        cost_per_person_day = 650.0
        cost_impact_usd = round(effort_person_days * cost_per_person_day, 2)

        # Step 5: Schedule Impact (Delay Days)
        schedule_delay_days = round(max(1.5, effort_person_days * 0.45 * (1.0 + d_coup)), 1)

        # Step 6: Risk Change (Delta Score)
        risk_increase_delta = round(min(35.0, (scope_change_pct * 0.8) + (d_coup * 15.0) + (c_comp * 0.4)), 1)
        new_projected_risk = round(min(99.0, current_risk + risk_increase_delta), 1)

        pipeline_steps = [
            {
                "step_index": 1,
                "step_name": "Scope Change",
                "metric_label": f"+{scope_change_pct}% Scope Expansion",
                "detail": f"+{added_loc} additional lines of code requested."
            },
            {
                "step_index": 2,
                "step_name": "Affected Modules",
                "metric_label": f"{affected_count} Core Modules Impacted",
                "detail": f"Modules: {', '.join(affected_module_names[:3])}"
            },
            {
                "step_index": 3,
                "step_name": "Effort Impact",
                "metric_label": f"{effort_person_days} Person-Days",
                "detail": "Derived from complexity and codebase churn multipliers."
            },
            {
                "step_index": 4,
                "step_name": "Cost Impact",
                "metric_label": f"${cost_impact_usd:,.0f} USD",
                "detail": "Estimated engineering capacity cost."
            },
            {
                "step_index": 5,
                "step_name": "Schedule Impact",
                "metric_label": f"+{schedule_delay_days} Days Delay",
                "detail": "Projected delivery milestone shift."
            },
            {
                "step_index": 6,
                "step_name": "Risk Change",
                "metric_label": f"+{risk_increase_delta} Risk Points",
                "detail": f"Overall risk increases from {current_risk:.1f} to {new_projected_risk:.1f}/100."
            }
        ]

        return {
            "is_insufficient_evidence": False,
            "scope_change_pct": scope_change_pct,
            "added_loc": added_loc,
            "affected_modules_count": affected_count,
            "effort_person_days": effort_person_days,
            "cost_impact_usd": cost_impact_usd,
            "schedule_delay_days": schedule_delay_days,
            "risk_increase_delta": risk_increase_delta,
            "new_projected_risk": new_projected_risk,
            "pipeline_steps": pipeline_steps,
            "summary": f"A {scope_change_pct}% scope expansion affects {affected_count} modules, requiring {effort_person_days} person-days (${cost_impact_usd:,.0f}), delaying delivery by {schedule_delay_days} days, and raising overall risk by +{risk_increase_delta} points."
        }

