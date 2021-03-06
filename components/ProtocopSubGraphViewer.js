'use babel';

import React from 'react';
// import { ButtonToolbar, Button, Glyphicon, ListGroup, ListGroupItem } from 'react-bootstrap';
import NodeTypes from './ProtocopQueryEditorNodeTypes';

const Graph = require('react-graph-vis').default;
const shortid = require('shortid');
const _ = require('lodash');
const seedrandom = require('seedrandom');

class ProtocopSubGraphViewer extends React.Component {
  constructor(props) {
    super(props);

    this.addTagsToGraph = this.addTagsToGraph.bind(this);
    this.setNetworkCallbacks = this.setNetworkCallbacks.bind(this);
    this.clickCallback = event => this.props.callbackOnGraphClick(event);

    this.styles = {
      supportEdgeColors: {
        color: '#aaa',
        highlight: '#3da4ed',
        hover: '#444',
      },
    };
    this.graphOptions = {
      height: '500px',
      physics: false,
      layout: {
        hierarchical: {
          enabled: false,
        },
      },
      edges: {
        smooth: true,
        color: {
          color: '#000',
          highlight: '#3da4ed',
          hover: '#000',
        },
        width: 1.5,
        hoverWidth: 1,
        selectionWidth: 1,
      },
      nodes: {
        shape: 'box',
        labelHighlightBold: true,
        color: {
          border: '#000',
          highlight: {
            border: '#848484',
          },
          hover: {
            border: '#333',
          },
        },
      },
      interaction: {
        hover: true,
        zoomView: true,
        dragView: true,
        hoverConnectedEdges: true,
        selectConnectedEdges: false,
        selectable: true,
        tooltipDelay: 50,
      },
    };
  }

  componentDidMount() {
    this.setNetworkCallbacks();
  }

  shouldComponentUpdate(nextProps) {
    // Only redraw/remount component if subgraph components change
    if (_.isEqual(this.props.subgraph, nextProps.subgraph)) {
      return false;
    }
    return true;
  }

  componentDidUpdate() {
    this.setNetworkCallbacks();
  }

  // Bind network fit callbacks to resize graph and cancel fit callbacks on start of zoom/pan
  setNetworkCallbacks() {
    this.network.on('afterDrawing', () => this.network.fit());
    this.network.on('doubleClick', () => this.network.fit());
    this.network.on('zoom', () => this.network.off('afterDrawing'));
    this.network.on('dragStart', () => this.network.off('afterDrawing'));
  }

  // Method to add requisite tags to graph definition JSON before passing to vis.js
  addTagsToGraph(graph) {
    // Generate innerHTML string for tooltip contents for a given edge
    function createTooltip(edge) {
      const defaultNames = {
        num_pubs: { name: 'Publications', precision: 0 },
        // pub_weight: { name: 'Confidence', precision: 4 },
        spect_weight: { name: 'Support Confidence', precision: 4 },
        edge_proba: { name: 'Combined Weight', precision: 4 },
        // proba_query: { name: 'Importance', precision: 4 },
        // proba_info: { name: 'Informativeness', precision: 4 },
      };
      // const defaultOrder = ['num_pubs', 'pub_weight', 'spect_weight', 'edge_proba'];
      const defaultOrder = ['num_pubs', 'spect_weight', 'edge_proba'];
      const innerHtml = defaultOrder.reduce((sum, k) => {
        if (_.hasIn(edge.scoring, k)) {
          return (
            `${sum}
            <div>
              <span class="field-name">${defaultNames[k].name}: </span>
              <span class="field-value">${edge.scoring[k].toFixed(defaultNames[k].precision)}</span>
            </div>`
          );
        }
        return sum;
      }, '');
      let edgeTypeString = 'Supporting';
      if (edge.type === 'Result') {
        edgeTypeString = 'Primary';
      } 
      if (edge.type === 'Lookup') {
        edgeTypeString = 'Lookup';
      } 
      return (
        `<div class="vis-tooltip-inner">
          <div><span class="title">${edgeTypeString} Edge</span></div>
          ${innerHtml}
        </div>`
      );
    }
    // Adds vis.js specific tags primarily to style graph as desired
    const g = _.cloneDeep(graph);
    const undefinedColor = '#f2f2f2';
    const nodeTypeColorMap = {};
    Object.keys(NodeTypes).forEach(k => (nodeTypeColorMap[NodeTypes[k].tag] = NodeTypes[k].color));

    g.nodes = g.nodes.map((n, i) => {
      const backgroundColor = nodeTypeColorMap[n.type] ? nodeTypeColorMap[n.type] : undefinedColor;
      n.color = {
        background: backgroundColor,
        highlight: { background: backgroundColor },
        hover: { background: backgroundColor },
      };
      n.label = n.name;
      n.x = 100; // Position nodes vertically
      n.y = i * 100;
      return n;
    });
    
    // g.edges = g.edges.map(e => ({ ...e, ...{ label: e.scoring.spect_weight.toFixed(2) } }));
    // Add parameters to edges like curvature if Support edge
    const rng = seedrandom('fixed seed'); // Set seed so re-renders look the same
    g.edges = g.edges.map((e) => {
      let edgeParams = {};
      if (e.type === 'Result' || e.type === 'Lookup') {
        edgeParams = { smooth: { type: 'curvedCW', roundness: 0 }};
      } else {
        edgeParams = {
          smooth: { type: rng() < 0.5 ? 'curvedCW' : 'curvedCCW', roundness: 0.6 },
          color: this.styles.supportEdgeColors,
          dashes: [2, 4],
        };
      }
      let label = e.scoring.num_pubs !== 0 ? `Pubs: ${e.scoring.num_pubs}` : '';
      const toId = e.to;
      const fromId = e.from;
      // console.log(e, e.to, e.from)
      if ((typeof toId === 'string' && toId.startsWith('NAME.')) || (typeof fromId === 'string' && e.from.startsWith('NAME.'))) {
        label = '';
      }
      return { ...e, ...{ label, ...edgeParams, title: createTooltip(e) } };
    });
    return g;
  }

  render() {
    let graph = this.props.subgraph;
    const isValid = !(graph == null) && (Object.prototype.hasOwnProperty.call(graph, 'nodes'));
    if (isValid) {
      graph = this.addTagsToGraph(graph);
    }
    
    return (
      <div>
        { isValid &&
        <div>
          <div style={{ fontFamily: 'Monospace' }}>
            <Graph
              key={shortid.generate()} // Forces component remount
              graph={graph}
              style={{ width: '100%' }}
              options={this.graphOptions}
              events={{ click: this.clickCallback }}
              getNetwork={(network) => { this.network = network }} // Store network reference in the component
            />
          </div>
        </div>
        }
      </div>
    );
  }
}

export default ProtocopSubGraphViewer;
