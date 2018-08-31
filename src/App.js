/*global chrome*/
import React, { Component } from 'react';
import './App.css';
import TrafficContainer from "./components/TrafficContainer";
import {getCurrentTab} from "./common/Utils";

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            traffic: {}
        };
    }

    componentDidMount() {
        getCurrentTab((tab) => {
            chrome.runtime.sendMessage({type: 'popupInit', tabId: tab.id}, (response) => {
                if (response) {
                    this.setState({
                        traffic: Object.assign(this.state.traffic, response)
                    });
                }
            });
        });
    }

    render() {
        // return (
        //   <div className="App">
        //     <header className="App-header">
        //       <h1 className="App-title">Welcome to WebTraffic</h1>
        //     </header>
        //     <p className="App-intro">
        //         <TrafficContainer traffic={this.state.traffic}/>
        //     </p>
        //   </div>
        // );
        return (
        <div className="App">
            <header id="header">
                <div class="inner">
                    <figure id="logo"><a class="anchor" title=""><img alt="" src="files/img/icon128.png"/></a></figure>
                    <p id="baseline"><a class="anchor" title=""><span class="appName"></span></a><span class="appVersion"></span></p>
                    <a class="btn" title="" id="btn_options"></a><a class="btn" title="" id="btn_download"></a>
                    <ul id="status">
                        <li id="status_external"><span class="bullet"></span>External rules<span class="tooltip">An error occured with external rules.</span></li>
                        <li id="status_internal"><span class="bullet"></span>Internal rules<span class="tooltip">An error occured with internal rules.</span></li>
                    </ul>
                    <span class="newline"></span>
                </div>
            </header>
            <section>
                <article id="tmaVars">
                <div class="inner" id="vars"></div>
                </article>
            </section>
        </div>
        );
    }
}

export default App;