import networkx as nx
from app.config import CAUSAL_EDGES

def build_causal_graph() -> nx.DiGraph:
    G = nx.DiGraph()
    for u, v, weight in CAUSAL_EDGES:
        G.add_edge(u, v, weight=weight)
    return G

causal_graph = build_causal_graph()
