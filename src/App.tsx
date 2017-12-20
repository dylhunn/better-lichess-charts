import * as React from 'react';
import * as bp from '@blueprintjs/core';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';

import './App.css';
import '@blueprintjs/core/dist/blueprint.css';

bp.FocusStyleManager.onlyShowFocusOnTabs();

const lichess = require('lichess-api');

const chartHeights = 250;

class App extends React.Component {

  // Game data
  allGames: any[] = [];

  // User data
  userData: any;

  // Application state
  unameBoxText = 'dylhunn';
  previouslySelectedUname = '';
  loading = false;

  // Temporary progress bar indicator variables
  tempPageNo = 0;
  tempTotalPages = 0;

  render() {

    let bulletChartData = this.allGames.filter(game => game.speed === 'bullet' && game.variant === 'standard');
    let blitzChartData = this.allGames.filter(game => game.speed === 'blitz' && game.variant === 'standard');
    let rapidChartData = this.allGames.filter(game => game.speed === 'rapid' && game.variant === 'standard');
    let classicalChartData = this.allGames.filter(game => game.speed === 'classical' && game.variant === 'standard');

    return (
      <div className="App">
        <h1 className="center-text">Better Lichess Charts</h1>
        <bp.Callout>
          The standard charts on Lichess aren't very rich, and the insights are challenging to use.
          This tool attempts to supplement them by automatically generating a report on your playing progress, complete with charts and graphs, without any manual filtering required.
        </bp.Callout>
        <span className="flex-span">
          <input className="pt-input pt-large pt-intent-primary uname-input" type="text" placeholder="Enter lichess username..." dir="auto" onChange={(e) => { this.unameBoxText = e.target.value; }} />
          <bp.Button className="pt-large pt-intent-success gen-btn" iconName="series-derived" onClick={() => this.startFetchingGames(this.unameBoxText)}>Generate</bp.Button>
        </span>
        <hr />
        {this.loading ? (
          <div className="loading-spinner">
            <i>Retrieving your games from lichess...</i>
            <br /><br />
            <bp.Spinner className="pt-large" />
            <br /><br />
            <i>({this.tempPageNo} / {this.tempTotalPages})</i>
            <hr />
            <h6>Lichess TV while you wait</h6>
            <iframe src="https://lichess.org/tv/frame?bg=light&theme=canvas" style={{ width: '224px', height: '264px' }} />
          </div>
        ) : (
            this.allGames.length > 0 ?
              (
                <div>
                  <h3>Contents</h3>
                  <a href="#player">Player</a> <br />
                  <a href="#ratings">Ratings</a>

                  <hr />

                  <div id="player" />
                  <h3>Player Information</h3>
                  <bp.Callout>
                    <h5>{this.userData.title} <a href={this.userData.url} target="_blank">{this.previouslySelectedUname}</a></h5>
                    <h6>{this.userData.profile.firstName} {this.userData.profile.lastName}</h6>
                    <p>{this.userData.profile.bio}</p>
                  </bp.Callout>
                  <br />
                  <table className="pt-table pt-striped pt-bordered">
                    <tbody>
                      <tr>
                        <td>Language</td>
                        <td>{this.userData.language}</td>
                      </tr>
                      <tr>
                        <td>Country</td>
                        <td>{this.userData.profile.country}</td>
                      </tr>
                      <tr>
                        <td>Location</td>
                        <td><a href={'http://maps.google.com/?q=' + encodeURIComponent(this.userData.profile.location)} target="_blank">{this.userData.profile.location}</a></td>
                      </tr>
                      <tr>
                        <td>Followers</td>
                        <td>{this.userData.nbFollowers}</td>
                      </tr>
                      <tr>
                        <td>Following</td>
                        <td>{this.userData.nbFollowing}</td>
                      </tr>
                      <tr>
                        <td>Currently Online</td>
                        <td>{this.userData.online ? (<bp.Tag className="pt-intent-success">Yes</bp.Tag>) : (<bp.Tag className="pt-intent-danger">No</bp.Tag>)}</td>
                      </tr>
                      <tr>
                        <td>Last Seen</td>
                        <td>{'' + (new Date(this.userData.seenAt))}</td>
                      </tr>
                      <tr>
                        <td>Account Created</td>
                        <td>{'' + (new Date(this.userData.createdAt))}</td>
                      </tr>
                      <tr>
                        <td>Playing Time</td>
                        <td>{this.userData.playTime.total} seconds <i>({(this.userData.playTime.total / 86400).toFixed(2)} days)</i></td>
                      </tr>
                      <tr>
                        <td>Lichess Patron</td>
                        <td>{this.userData.patron ? (<bp.Tag className="pt-intent-success">Yes</bp.Tag>) : (<bp.Tag className="pt-intent-danger">No</bp.Tag>)}</td>
                      </tr>
                    </tbody>
                  </table>

                  <hr />

                  <div id="ratings" />
                  <h3>Standard Chess: Bullet</h3>
                  <h5>Rating progression over time</h5>
                  <ResponsiveContainer width="100%" height={chartHeights}>
                    <AreaChart
                      data={bulletChartData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <XAxis dataKey="lastMoveAt" scale="time" tickFormatter={(timestamp) => {
                        let date = new Date(timestamp);
                        return date.getMonth() + '/' + date.getDay() + '/' + date.getFullYear();
                      }} />
                      <YAxis domain={['dataMin', 'dataMax']} />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip label="Rating" labelFormatter={(timestamp) => { return (new Date(timestamp)) + ''; }} />
                      <Area type="monotone" dataKey="ratingAfter" stroke="#8884d8" fill="#8884d8" />
                    </AreaChart>
                  </ResponsiveContainer>
                  <hr />

                  <h3>Standard Chess: Blitz</h3>
                  <h5>Rating progression over time</h5>
                  <ResponsiveContainer width="100%" height={chartHeights}>
                    <AreaChart
                      data={blitzChartData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <XAxis dataKey="lastMoveAt" scale="time" tickFormatter={(timestamp) => {
                        let date = new Date(timestamp);
                        return date.getMonth() + '/' + date.getDay() + '/' + date.getFullYear();
                      }} />
                      <YAxis domain={['dataMin', 'dataMax']} />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip label="Rating" labelFormatter={(timestamp) => { return (new Date(timestamp)) + ''; }} />
                      <Area type="monotone" dataKey="ratingAfter" stroke="#8884d8" fill="#8884d8" />
                    </AreaChart>
                  </ResponsiveContainer>
                  <hr />

                  <h3>Standard Chess: Rapid</h3>
                  <h5>Rating progression over time</h5>
                  <ResponsiveContainer width="100%" height={chartHeights}>
                    <AreaChart
                      data={rapidChartData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <XAxis dataKey="lastMoveAt" scale="time" tickFormatter={(timestamp) => {
                        let date = new Date(timestamp);
                        return date.getMonth() + '/' + date.getDay() + '/' + date.getFullYear();
                      }} />
                      <YAxis domain={['dataMin', 'dataMax']} />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip label="Rating" labelFormatter={(timestamp) => { return (new Date(timestamp)) + ''; }} />
                      <Area type="monotone" dataKey="ratingAfter" stroke="#8884d8" fill="#8884d8" />
                    </AreaChart>
                  </ResponsiveContainer>
                  <hr />

                  <h3>Standard Chess: Classical</h3>
                  <h5>Rating progression over time</h5>
                  <ResponsiveContainer width="100%" height={chartHeights}>
                    <AreaChart
                      data={classicalChartData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <XAxis dataKey="lastMoveAt" scale="time" tickFormatter={(timestamp) => {
                        let date = new Date(timestamp);
                        return date.getMonth() + '/' + date.getDay() + '/' + date.getFullYear();
                      }} />
                      <YAxis domain={['dataMin', 'dataMax']} />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip label="Rating" labelFormatter={(timestamp) => { return (new Date(timestamp)) + ''; }} />
                      <Area type="monotone" dataKey="ratingAfter" stroke="#8884d8" fill="#8884d8" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

              ) : (
                <div className="non-ideal-pad">
                  <div className="pt-non-ideal-state">
                    <div className="pt-non-ideal-state-visual pt-non-ideal-state-icon">
                      <span className="pt-icon pt-icon-user" />
                    </div>
                    <h4 className="pt-non-ideal-state-title">No Valid User Selected</h4>
                    <div className="pt-non-ideal-state-description">
                      Enter a valid username.
                    </div>
                  </div>

                </div>
              )
          )
        }
      </div>
    );
  }

  startFetchingGames(uname: string) {
    this.previouslySelectedUname = this.unameBoxText;
    this.allGames = [];
    this.loading = true;
    this.tempPageNo = 0;
    this.forceUpdate();

    if (uname === '') {
      this.loading = false;
      this.forceUpdate();
      return;
    }

    lichess.user(uname, (err, user: string) => {
      this.userData = JSON.parse(user);
      console.log(this.userData);
    });

    lichess.user.games(uname,
      { with_analysis: 1, rated: 1, with_opening: 1, nb: 100, page: 1, with_movetimes: 1 },
      (err: string, games: string) => {
        let pageData = JSON.parse(games);
        this.allGames = this.allGames.concat(pageData.currentPageResults);
        this.tempTotalPages = pageData.nbPages;
        this.fetchGamePage(2, pageData.nbPages, uname);
      }
    );
  }

  fetchGamePage(currPage: number, numPages: number, uname: string) {
    if (currPage > numPages) {
      this.fetchGamesComplete();
      return;
    }
    this.tempPageNo = currPage;
    this.forceUpdate();
    lichess.user.games(uname,
      { with_analysis: 1, rated: 1, with_opening: 1, nb: 100, page: currPage, with_movetimes: 1 },
      (err: string, games: string) => {
        let pageData = JSON.parse(games);
        this.allGames = this.allGames.concat(pageData.currentPageResults);
        this.fetchGamePage(currPage + 1, numPages, uname);
      }
    );
  }

  fetchGamesComplete() {
    this.allGames.reverse(); // Reverse the array, since recent games are first
    this.allGames.forEach(game => {
      // Calculate the ending rating
      let rating: number;
      if (game.players.black.userId === this.previouslySelectedUname) {
        rating = game.players.black.rating + game.players.black.ratingDiff;
      } else {
        rating = game.players.white.rating + game.players.white.ratingDiff;
      }
      game['ratingAfter'] = rating;
      // Calculate the ending datetime
      let enddate = new Date(game.lastMoveAt);
      game['enddate'] = '' + enddate;
    });
    console.log(this.allGames);
    this.loading = false;
    this.forceUpdate();
  }

}

export default App;
