'use babel';

import React from 'react';
import { ButtonGroup, Button, Glyphicon, Tabs, Tab } from 'react-bootstrap';
import ProtocopRankingBrowser from './ProtocopRankingBrowser';
import ProtocopRankingSelector from './ProtocopRankingSelector';

class ProtocopRanking extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tabKey: 1,
    };

    this.styles = {
      buttonRow: {
        padding: 5,
      },
    };

    this.handleTabSelect = this.handleTabSelect.bind(this);
  }

  handleTabSelect(tabKey) {
    this.setState({ tabKey });
  }

  render() {
    const noRank = this.props.ranking == null;
    const noAnswers = !noRank && this.props.ranking.length === 0;
    const graph = this.props.graph;

    // const isSummary = !(graph == null) && Object.prototype.hasOwnProperty.call(graph, 'node_count');
    const isGraph = !(graph == null) && (Object.prototype.hasOwnProperty.call(graph, 'nodes'));
    let isEmpty = false;

    let nNodes = 0;
    let nEdges = 0;
    if (isGraph) {
      isEmpty = graph.nodes.length === 0;
      nNodes = graph.nodes.length;
      nEdges = graph.edges.length;
    } else { // isSummary
      isEmpty = graph.node_count === 0;
      nNodes = graph.node_count;
      nEdges = graph.edge_count;
    }

    
    const showNoAnswers = noAnswers;
    const showEmptyGraph = !noAnswers && isEmpty;
    const showEvalButton = !noAnswers && !isEmpty && noRank;
    const showAnswers = !noAnswers && !isEmpty && !noRank;

    return (
      <div id="ProtocopRanking" className="col-md-12">
        { showNoAnswers &&
          <div id="ProtocopRanking_NoRank" className="col-md-12">
            <div className="row">
              <div className="col-md-6 col-md-offset-3">
                <h2>{'No answers.'}</h2>
                <p>{'We couldn\'t find a path through this blackboard to answer the question.'}</p>
              </div>
            </div>
          </div>
        }
        { showEmptyGraph &&
          <div id="ProtocopRanking_NoRank" className="col-md-12">
            <div className="row">
              <div className="col-md-6 col-md-offset-3">
                <h2>{'This is an empty graph.'}</h2>
                <p>{'We can\'t provide answers without any input. Try another blackboard.'}</p>
              </div>
            </div>
          </div>
        }
        { showEvalButton &&
          <div id="ProtocopRanking_NoRank" className="col-md-12">
            <div className="row">
              <div className="col-md-6 col-md-offset-3">
                <h2>{'We still need to evaluate your blackboard.'}</h2>
                <p>{'After your blackboard is created we need to analyze it to determine and rank answers to your query.'}</p>
              </div>
            </div>
            <div className="row">
              <div className="col-md-2 col-md-offset-5" style={{ paddingTop: '10px' }}>
                <Button bsStyle="default" bsSize="lg" onClick={this.props.callbacks.blackboardRank}>
                  {'Get Answers'}
                  <br />
                  <Glyphicon glyph="random" />
                </Button>
              </div>
            </div>
          </div>
        }
        { showAnswers &&
          <div>
            <div id="ProtocopRanking_Buttons" className="col-md-12" style={this.styles.buttonRow}>
              <h5>{'Potential answers have been ranked and are shown below.'}
                <span style={{ paddingLeft: '20px' }}>
                  <ButtonGroup>
                    <Button bsStyle="default" bsSize="sm" onClick={this.props.callbacks.blackboardRank}>
                      <Glyphicon glyph="refresh" /> {'Refresh Ranking'}
                    </Button>
                    {/* <Button bsStyle="default" bsSize="sm" onClick={() => shell.openExternal('http://127.0.0.1:7474/browser/')}>
                      <Glyphicon glyph="open-file" /> Explore in Neo4j
                    </Button> */}
                  </ButtonGroup>
                </span>
              </h5>
            </div>
            <Tabs activeKey={this.state.tabKey} onSelect={this.handleTabSelect} id="ProtocopRankingTabs">
              <Tab eventKey={1} title="List Explorer">
                <ProtocopRankingBrowser
                  ranking={this.props.ranking}
                />
              </Tab>
              <Tab eventKey={2} title="Interactive">
                <ProtocopRankingSelector
                  ranking={this.props.ranking}
                />
              </Tab>
            </Tabs>
          </div>
        }
      </div>
    );
  }
}

export default ProtocopRanking;
