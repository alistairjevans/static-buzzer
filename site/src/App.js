import React, { Component } from 'react';
import * as signalR from '@microsoft/signalr';

export default class App extends Component 
{
  connection = null;

  constructor()
  {
    super();
    
    this.state = { user: 'user1' }

    this.onBuzz = this.onBuzz.bind(this);
  }

  componentDidMount()
  {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${process.env.REACT_APP_FUNCTIONS_ENDPOINT}/api`)
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.connection.on('userBuzzed', this.buzzReceived);

    this.connect();
  }

  componentWillUnmount()
  {
    this.connection.stop();
  }

  buzzReceived(user, timestamp)
  {
    console.log(user, timestamp);
  }

  async onBuzz()
  {
    try {
      await fetch(`${process.env.REACT_APP_FUNCTIONS_ENDPOINT}/api/userBuzzed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user: this.state.user })
      });
    }
    catch(err)
    {
      console.error(err);
    }
  }

  render()
  {  
    return (
      <div>
          <div className="buzzer" aria-label="Buzzer" onClick={this.onBuzz}></div>
      </div>);
  }

  async connect()
  {
    console.log("Connecting");    
    try {
      await this.connection.start();
      console.log("Connected");
    } catch (err) {
      console.log(err);
      setTimeout(() => this.connect(), 5000);
    }
  }
}