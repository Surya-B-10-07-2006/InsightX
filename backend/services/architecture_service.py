import networkx as nx
import logging
from typing import Dict, Any, List

logger = logging.getLogger("InsightX.Architecture")

class ArchitectureRiskService:
    """Graph-theoretic architecture risk analysis using NetworkX.
    Computes Circular Cycles, Robert C. Martin metrics, Modularity Q-Score, and God Modules.
    """

    @staticmethod
    def analyze_architecture(
        file_tree: List[str],
        parsed_files: List[Dict[str, Any]],
        hotspots: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        G = nx.DiGraph()

        # Add all parsed files as nodes
        file_map = {f.get("file", ""): f for f in parsed_files if f.get("file")}
        if not file_map and file_tree:
            file_map = {f: {"file": f, "loc": 200, "complexity": 5.0, "imports": []} for f in file_tree}

        for fname, f_data in file_map.items():
            G.add_node(
                fname,
                loc=f_data.get("loc", 100),
                complexity=f_data.get("complexity", 1.0),
                classes=f_data.get("classes", 1),
                functions=f_data.get("functions", 2)
            )

        # Add directed dependency edges from imports
        all_nodes = list(G.nodes())
        for source_node, f_data in file_map.items():
            imports = f_data.get("imports", [])
            for imp in imports:
                clean_imp = imp.replace(".", "/").replace("\\", "/")
                # Find matching target node in repo
                for target_node in all_nodes:
                    if target_node != source_node and (clean_imp in target_node or target_node.endswith(clean_imp) or clean_imp.split("/")[-1] in target_node):
                        G.add_edge(source_node, target_node, weight=1)

        # 1. Circular Dependency Cycle Detection
        detected_cycles: List[List[str]] = []
        try:
            raw_cycles = list(nx.simple_cycles(G))
            for cycle in raw_cycles[:10]:
                if len(cycle) >= 2:
                    detected_cycles.append(cycle)
        except Exception as e:
            logger.debug(f"Cycle detection note: {e}")

        # 2. Robert C. Martin Architecture Metrics (Ca, Ce, Instability, Distance from Main Sequence)
        module_metrics: List[Dict[str, Any]] = []
        zone_of_pain_count = 0
        zone_of_uselessness_count = 0

        for node in G.nodes():
            in_deg = G.in_degree(node)   # Afferent Coupling (Ca)
            out_deg = G.out_degree(node) # Efferent Coupling (Ce)
            
            total_coupling = in_deg + out_deg
            instability = round(out_deg / max(total_coupling, 1), 2)

            node_data = G.nodes[node]
            classes = node_data.get("classes", 1)
            functions = node_data.get("functions", 2)
            abstractness = round(min(classes / max(classes + functions, 1), 1.0), 2)

            # Distance from Main Sequence: D = |A + I - 1|
            distance = round(abs(abstractness + instability - 1.0), 2)

            if distance > 0.6 and instability < 0.3:
                zone = "ZONE_OF_PAIN"  # Highly stable & rigid, very concrete -> painful to change
                zone_of_pain_count += 1
            elif distance > 0.6 and instability > 0.7:
                zone = "ZONE_OF_USELESSNESS"  # Highly unstable & abstract -> unused abstractions
                zone_of_uselessness_count += 1
            else:
                zone = "BALANCED_MAIN_SEQUENCE"

            module_metrics.append({
                "module": node,
                "afferent_coupling_ca": in_deg,
                "efferent_coupling_ce": out_deg,
                "instability": instability,
                "abstractness": abstractness,
                "distance_from_main_sequence": distance,
                "architecture_zone": zone,
                "is_circular": any(node in c for c in detected_cycles)
            })

        # 3. God-Module / Central Hub Detection
        betweenness = nx.betweenness_centrality(G) if len(G) > 1 else {n: 0.0 for n in G.nodes()}
        god_modules: List[Dict[str, Any]] = []

        for node in G.nodes():
            b_score = round(betweenness.get(node, 0.0), 3)
            tot_coupling = G.in_degree(node) + G.out_degree(node)
            loc = G.nodes[node].get("loc", 100)
            
            if (b_score > 0.25 or tot_coupling >= 6 or loc > 1200) and len(G) > 3:
                god_modules.append({
                    "module": node,
                    "betweenness_centrality": b_score,
                    "total_coupling": tot_coupling,
                    "loc": loc,
                    "bottleneck_severity": "CRITICAL" if b_score > 0.4 else "HIGH",
                    "risk_driver": "Over-centralized dependency router & structural bottleneck"
                })

        god_modules.sort(key=lambda x: x["betweenness_centrality"], reverse=True)

        # 4. Modularity Q-Score Approximation
        num_nodes = len(G.nodes())
        num_edges = len(G.edges())
        density = round(nx.density(G), 3) if num_nodes > 1 else 0.0

        # Modularity estimation based on clustering & cycle density
        base_modularity = max(0.2, 1.0 - (density * 1.8) - (len(detected_cycles) * 0.12))
        modularity_score = round(min(1.0, max(0.05, base_modularity)), 2)

        # 5. Composite Architecture Risk Index (0 - 100, where higher is more risky)
        cycle_penalty = min(len(detected_cycles) * 15.0, 45.0)
        god_module_penalty = min(len(god_modules) * 10.0, 30.0)
        pain_zone_penalty = min(zone_of_pain_count * 5.0, 20.0)
        density_penalty = density * 20.0

        raw_arch_risk = 15.0 + cycle_penalty + god_module_penalty + pain_zone_penalty + density_penalty
        architecture_risk_index = round(min(98.0, max(12.0, raw_arch_risk)), 1)

        arch_health_grade = (
            "A (Optimal Architecture)" if architecture_risk_index < 30
            else "B (Minor Coupling Drift)" if architecture_risk_index < 50
            else "C (Elevated Structural Debt)" if architecture_risk_index < 70
            else "D (Severe Architecture Decay)" if architecture_risk_index < 85
            else "F (Critical Spaghetti Coupling)"
        )

        return {
            "architecture_risk_index": architecture_risk_index,
            "architecture_health_grade": arch_health_grade,
            "modularity_q_score": modularity_score,
            "graph_density": density,
            "total_nodes": num_nodes,
            "total_edges": num_edges,
            "circular_cycles_count": len(detected_cycles),
            "circular_cycles": detected_cycles[:6],
            "god_modules_count": len(god_modules),
            "god_modules": god_modules[:5],
            "zone_of_pain_modules_count": zone_of_pain_count,
            "zone_of_uselessness_modules_count": zone_of_uselessness_count,
            "module_metrics_sample": sorted(module_metrics, key=lambda x: x["distance_from_main_sequence"], reverse=True)[:10]
        }
