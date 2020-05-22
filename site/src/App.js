import React, { Component } from 'react';
import { Container, Typography } from '@material-ui/core';
import BuzzerPage from './BuzzerPage';
import GetUserPage from './GetUserPage';

export default class App extends Component 
{
  constructor()
  {
    super();

    this.state = { user: null }    
  }

  onPlayReady = (user) => {
    this.setState({ user });
  }

  render()
  {
    const { user } = this.state;
    const page = user ?  
      <BuzzerPage user={user} /> :
      <GetUserPage onPlayReady={this.onPlayReady} />;
    return <Container maxWidth="md">
      <Typography variant="h3" gutterBottom>Game Buzzer</Typography>
      {page}
    </Container>;
  }
}