import React, { Component } from "react";
import { Button, TextField , Typography, Grid, Paper } from '@material-ui/core';
import { PlayForWork } from '@material-ui/icons';

class GetUserPage extends Component
{
    constructor()
    {
        super();

        this.state = { user: '' };
    }

    onNameChange = (ev) =>
    {
        this.setState({ user: ev.target.value });
    }

    onPlayClick = (ev) => {

        const { onPlayReady } = this.props;

        if (onPlayReady)
        {
            onPlayReady(this.state.user);
        }

        ev.preventDefault();
    }

    render()
    {
        const isPlayButtonDisabled = !this.state.user;

        return <Paper style={{ padding: 20 }}>
            <Typography variant="h6" gutterBottom>Who's Playing?</Typography>
            <form>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <TextField 
                            id="playerName"
                            label="Player Name" 
                            name="player" 
                            variant="outlined" 
                            aria-label="Player Name" 
                            fullWidth
                            value={this.state.user}
                            onChange={this.onNameChange}
                            autoFocus />
                    </Grid>
                    <Grid item xs={12}>
                        <Button 
                            onClick={this.onPlayClick} 
                            variant="contained" 
                            disabled={isPlayButtonDisabled} 
                            color="primary"
                            size="large"
                            type="submit"
                            endIcon={<PlayForWork />}>
                                Let's Play!
                        </Button>
                    </Grid>
                </Grid>
            </form>
        </Paper>;
    }
}

export default GetUserPage;