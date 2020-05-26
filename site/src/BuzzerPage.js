import React, { Component } from "react";
import * as signalR from '@microsoft/signalr';
import { List, ListItem, ListItemText, Paper, Divider } from '@material-ui/core';
import buzzerAudio from './assets/buzzer.mp3';
import { withStyles } from 'react-jss';

const styles = {
    buzzer: {
        width: 250,
        height: 220,
        lineHeight: '250',
        marginLeft: 'auto',
        marginRight: 'auto',
        textAlign: 'center',
        cursor: 'pointer',
        borderRadius: '50%',
        background: '#f74d4d',
        backgroundImage: 'linear-gradient(to top, #f74d4d 0%, #f86569 100%))',
        boxShadow: '0 15px #e24f4f',
        marginBottom: 25,
        '&:active': {
            boxShadow: '0 0 #e24f4f',
            transform: 'translate(0px, 15px)',
            transition: '0.1s all ease-out'
        },
    },
    buzzerTouched: {
       composes: '$buzzer',       
       boxShadow: '0 0 #e24f4f',
       transform: 'translate(0px, 15px)',
       transition: '0.1s all ease-out'
    },
    buzzContainer: {
        opacity: 1,
        transition: 'opacity',
        transitionDuration: 500
    },
    buzzContainerExpired: {
        composes: '$buzzContainer',
        opacity: 0.6
    },
    audioPlayer: {
        visibility: 'hidden'
    }
};

class BuzzerPage extends Component {
    connection = null;
    lastBuzz = Date.now();
    audio = null;
    expiryTimer = null;

    constructor() {
        super();

        this.state = { buzzes: [], buzzesExpired: false, buzzerTouched: false };

        this.onBuzz = this.onBuzz.bind(this);
        this.onTouchBuzz = this.onTouchBuzz.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
        this.buzzReceived = this.buzzReceived.bind(this);

        this.audio = React.createRef();
    }

    componentDidMount() {
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(`${process.env.REACT_APP_FUNCTIONS_ENDPOINT}/api`)
            .configureLogging(signalR.LogLevel.Information)
            .build();

        this.connection.on('userBuzzed', this.buzzReceived);

        this.connect();
    }

    componentWillUnmount() {
        this.connection.stop();
    }

    buzzReceived(user, timestamp) {
        let buzzTime = new Date(timestamp);

        this.lastBuzz = Date.now();

        let buzzes;
        let added = false;

        if (this.state.buzzesExpired) {
            buzzes = [{ user, buzzTime }];
            added = true;
        }
        else if (!this.state.buzzes.find(b => b.user === user)) {
            buzzes = [...this.state.buzzes, { user, buzzTime }];

            if (this.expiryTimer) {
                clearTimeout(this.expiryTimer);
            }

            added = true;
        }

        if (added) {
            // Sort the items by the time, so we know who the winner is.
            var sortedSet = this.sortBuzzes(buzzes);

            this.setState({ buzzes: sortedSet, buzzesExpired: false });

            if (user !== this.props.user) {
                // Someone else's buzz arrived, play the buzzer audio.
                var audioEl = this.audio.current;
                audioEl.currentTime = 0.5;
                audioEl.play();
            }

            this.expiryTimer = setTimeout(() => {
                this.setState({ buzzesExpired: true });
            }, 3000);
        }
    }

    async onBuzz() {
        if (this.props.user) {
            try {
                var audioEl = this.audio.current;
                audioEl.currentTime = 0.5;
                audioEl.play();

                await fetch(`${process.env.REACT_APP_FUNCTIONS_ENDPOINT}/api/userBuzzed`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ user: this.props.user })
                });
            }
            catch (err) {
                console.error(err);
            }
        }
    }

    onTouchBuzz() {
        this.setState({ buzzerTouched: true });
        this.onBuzz();
    }
    onTouchEnd() {
        this.setState({ buzzerTouched: false });
    }

    render() {
        const { classes } = this.props;
        const { buzzes, buzzesExpired, buzzerTouched } = this.state;

        const buzzerClass = buzzerTouched ? classes.buzzerTouched : classes.buzzer;

        let buzzList = buzzes.length ? this.renderBuzzSet(buzzes) : <div />;

        return (
            <div>                
                <div className={buzzerClass} aria-label="Buzzer" onMouseDown={this.onBuzz} onTouchStart={this.onTouchBuzz} onTouchEnd={this.onTouchEnd}></div>
                <Paper><div className={buzzesExpired ? classes.buzzContainerExpired : classes.buzzContainer}>{buzzList}</div></Paper>                
                <audio ref={this.audio} className={classes.audioPlayer} preload="auto" src={buzzerAudio}></audio>
            </div>
        );
    }

    renderBuzzSet(buzzes) {
        let winningTimeStamp = null;

        return <List>
            {buzzes.map((item, idx) => {
                if (idx === 0) {
                    winningTimeStamp = item.buzzTime.getTime();

                    const content = <span>#{idx + 1} {item.user} <span role="img" aria-label="winner">🎉</span></span>;

                    return <ListItem key={idx} className="buzz winner">
                        <ListItemText primary={content} />
                    </ListItem>;
                }
                else {
                    const diff = (item.buzzTime.getTime() - winningTimeStamp) / 1000;

                    const content = <span>#{idx + 1} {item.user}</span>
                    const secondaryContent = <span>+{diff} seconds</span>

                    return <ListItem key={idx} className="buzz loser">
                        <ListItemText primary={content} secondary={secondaryContent} />
                    </ListItem>;
                }
            }).reduce((prev, curr, currIdx) => [prev, <Divider key={`div-${currIdx}`} />, curr])}
        </List>;
    }

    async connect() {
        console.log("Connecting");
        try {
            await this.connection.start();
            console.log("Connected");
        } catch (err) {
            console.log(err);
            setTimeout(() => this.connect(), 5000);
        }
    }

    sortBuzzes(buzzList) {
        return buzzList.sort((left, right) => {
            var leftStamp = left.buzzTime.getTime();
            var rightStamp = right.buzzTime.getTime();
            if (leftStamp < rightStamp) {
                return -1;
            }
            if (rightStamp > leftStamp) {
                return 1;
            }
            return 0;
        });
    }
}

export default withStyles(styles) (BuzzerPage);