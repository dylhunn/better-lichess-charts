import * as React from 'react';
import * as bp from '@blueprintjs/core';

import $ from 'jquery';
import Chess from 'chessboardjs';

import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, PieChart, ScatterChart, Scatter, Pie, Cell, Label, Legend } from 'recharts';

import './App.css';
import '@blueprintjs/core/dist/blueprint.css';
import '../node_modules/chessboardjs/www/releases/0.3.0/css/chessboard-0.3.0.css';

window['$'] = $;
window['jQuery'] = $;

bp.FocusStyleManager.onlyShowFocusOnTabs();

const lichess = require('lichess-api');

const chartHeights = 250;

const numGamesInTable = 25;

const ecoRangeNames = { // the Eco code is the starting code for each segment of openings
  'A00': 'Irregular Openings',
  'A01': 'Larsen\'s Opening',
  'A02': 'Bird\'s Opening',
  'A04': 'Reti Opening',
  'A10': 'English Opening',
  'A40': 'Atypical Replies to 1. d4',
  'A45': 'Atypical Replies to 1. d4 Nf6',
  'A50': 'Atypical Indian Systems',
  'A56': 'Benoni Defense',
  'A80': 'Dutch Defense',
  'B00': 'King\'s Pawn Opening',
  'B01': 'Scandinavian Defense',
  'B02': 'Alekhine\'s Defense',
  'B07': 'Pirc Defense',
  'B10': 'Caro-Kann Defense',
  'B20': 'Sicilian Defense',
  'C00': 'French Defense', 
  'C20': 'Open Game',
  'C60': 'Open Game: Ruy Lopez',
  'D00': 'Closed Game',
  'D06': 'Queen\'s Gambit',
  'D70': 'Grünfeld Defence',
  'E00': 'Other Indian Systems',
  'E20': 'Nizmo-Indian Defense',
  'E60': 'King\'s Indian Defense',
}

const ecoRangeColors = { // Colors for the pie chart
  'Irregular Openings': '#EA3817',
  'Larsen\'s Opening': '#EA3817',
  'Bird\'s Opening': '#EA3817',
  'Reti Opening': '#EA3817',
  'English Opening': '#EA3817',
  'Atypical Replies to 1. d4': '#EA3817',
  'Atypical Replies to 1. d4 Nf6': '#EA3817',
  'Atypical Indian Systems': '#EA3817',
  'Benoni Defense': '#EA3817',
  'Dutch Defense': '#EA3817',
  'King\'s Pawn Opening': '#00C9C8',
  'Scandinavian Defense': '#00C9C8',
  'Alekhine\'s Defense': '#00C9C8',
  'Pirc Defense': '#00C9C8',
  'Caro-Kann Defense': '#00C9C8',
  'Sicilian Defense': '#00C9C8',
  'French Defense': '#FAC200',
  'Open Game': '#FAC200',
  'Open Game: Ruy Lopez': '#FAC200',
  'Closed Game': '#5BB832',
  'Queen\'s Gambit': '#5BB832',
  'Grünfeld Defence': '#5BB832',
  'Other Indian Systems': '#59344F',
  'Nizmo-Indian Defense': '#59344F',
  'King\'s Indian Defense': '#59344F',
}

// Returns the generic ("range") name for an eco code
function getEcoGenericName(eco: string): string {
  let openingGenericNameCodes = Object.keys(ecoRangeNames).sort((a, b) => a.localeCompare(b));
  for (let i = openingGenericNameCodes.length - 1; i >= 0; i--) {
    if (openingGenericNameCodes[i].localeCompare(eco) <= 0) {
      return ecoRangeNames[openingGenericNameCodes[i]];
    }
  }
  return "Unclassified Opening";  
}

class ChessBoard extends React.Component {
  render() {
    return (
      <div>
        <div id="board1" style={{ 'width': '400px' }} />
      </div>
    );
  }

  componentDidMount() {
    var cfg = {
      draggable: true,
      dropOffBoard: 'snapback', // this is the default
      position: 'start'
    };
    var board = Chess('board1', cfg);
  }
}

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
    let standardGames = this.allGames.filter(game => game.variant === 'standard');
    let bulletChartData = this.allGames.filter(game => game.speed === 'bullet' && game.variant === 'standard');
    let blitzChartData = this.allGames.filter(game => game.speed === 'blitz' && game.variant === 'standard');
    let rapidChartData = this.allGames.filter(game => game.speed === 'rapid' && game.variant === 'standard');
    let classicalChartData = this.allGames.filter(game => game.speed === 'classical' && game.variant === 'standard');

    // Calculate data on openings    
    let whiteGames = this.allGames.filter(game => game.variant === 'standard' && game.players.white.userId.toUpperCase() === this.previouslySelectedUname.toUpperCase());
    let blackGames = this.allGames.filter(game => game.variant === 'standard' && game.players.black.userId.toUpperCase() === this.previouslySelectedUname.toUpperCase());

    let openingNames = {};

    let whiteOpeningCounts = {};
    let blackOpeningCounts = {};
    let allOpeningCounts = {};

    let whiteOpeningPie: any[] = [];
    let blackOpeningPie: any[] = [];
    let allOpeningPie: any[] = [];

    whiteGames.forEach(game => {
      if (!('opening' in game)) { // Aborted games might not have an opening field
        return;
      }
      if (!(game.opening.eco in whiteOpeningCounts)) {
        whiteOpeningCounts[game.opening.eco] = 0;
      }
      if (!(game.opening.eco in openingNames)) {
        openingNames[game.opening.eco] = game.opening.name;
      }
      whiteOpeningCounts[game.opening.eco]++;
    });

    blackGames.forEach(game => {
      if (!('opening' in game)) { // Aborted games might not have an opening field
        return;
      }
      if (!(game.opening.eco in blackOpeningCounts)) {
        blackOpeningCounts[game.opening.eco] = 0;
      }
      if (!(game.opening.eco in openingNames)) {
        openingNames[game.opening.eco] = game.opening.name;
      }
      blackOpeningCounts[game.opening.eco]++;
    });

    allOpeningCounts = JSON.parse(JSON.stringify(whiteOpeningCounts)); // deep copy the object
    Object.keys(blackOpeningCounts).forEach(openingEco => {
      if (openingEco in allOpeningCounts) {
        allOpeningCounts[openingEco] += blackOpeningCounts[openingEco];
      } else {
        allOpeningCounts[openingEco] = blackOpeningCounts[openingEco];
      }
    });

    // Populate data structures for the pie charts
    Object.keys(whiteOpeningCounts).forEach(eco => { whiteOpeningPie.push({ 'eco': eco, 'games': whiteOpeningCounts[eco], 'name': openingNames[eco], 'shortname': getEcoGenericName(eco) }); });
    Object.keys(blackOpeningCounts).forEach(eco => { blackOpeningPie.push({ 'eco': eco, 'games': blackOpeningCounts[eco], 'name': openingNames[eco], 'shortname': getEcoGenericName(eco) }); });
    Object.keys(allOpeningCounts).forEach(eco => { allOpeningPie.push({ 'eco': eco, 'games': allOpeningCounts[eco], 'name': openingNames[eco], 'shortname': getEcoGenericName(eco) }); });

    // Sort the chart data lexically by Eco code
    whiteOpeningPie.sort((entry1, entry2) => entry1.eco.localeCompare(entry2.eco));
    blackOpeningPie.sort((entry1, entry2) => entry1.eco.localeCompare(entry2.eco));
    allOpeningPie.sort((entry1, entry2) => entry1.eco.localeCompare(entry2.eco));

    // Populate the short openings
    let allShortOpeningsPie: any[] = [];
    allOpeningPie.forEach(entry => {
      if (allShortOpeningsPie.length == 0 || allShortOpeningsPie[allShortOpeningsPie.length - 1].shortname != entry.shortname) {
        allShortOpeningsPie.push({ 'shortname': entry.shortname, 'games': entry.games });
      } else {
        allShortOpeningsPie[allShortOpeningsPie.length - 1].games += entry.games;
      }
    });

    let whiteShortOpeningsPie: any[] = [];
    whiteOpeningPie.forEach(entry => {
      if (whiteShortOpeningsPie.length == 0 || whiteShortOpeningsPie[whiteShortOpeningsPie.length - 1].shortname != entry.shortname) {
        whiteShortOpeningsPie.push({ 'shortname': entry.shortname, 'games': entry.games });
      } else {
        whiteShortOpeningsPie[whiteShortOpeningsPie.length - 1].games += entry.games;
      }
    });

    let blackShortOpeningsPie: any[] = [];
    blackOpeningPie.forEach(entry => {
      if (blackShortOpeningsPie.length == 0 || blackShortOpeningsPie[blackShortOpeningsPie.length - 1].shortname != entry.shortname) {
        blackShortOpeningsPie.push({ 'shortname': entry.shortname, 'games': entry.games });
      } else {
        blackShortOpeningsPie[blackShortOpeningsPie.length - 1].games += entry.games;
      }
    });

    return (
      <div className="App">
        <h1 className="center-text">Better Lichess Analytics</h1>
        <h5 className="center-text">Instant analytics on any player</h5>
        <bp.Callout>
          The standard charts on Lichess aren't very rich, and the insights are challenging to use.&nbsp;
          Additionally, Lichess makes it impossible to view insights on other players!&nbsp;
          This tool attempts to automatically generate a report on your (or an opponent's) playing data, complete with charts and graphs, without any manual filtering required.&nbsp;
          <i>This is an <a href="https://github.com/dylhunn/better-lichess-charts" target="_blank">open source project</a></i>.
        </bp.Callout>
        <span className="flex-span">
          <input className="pt-input pt-large pt-intent-primary uname-input" type="text" placeholder="Lichess username..." dir="auto" onChange={(e) => { this.unameBoxText = e.target.value; }} />
          <bp.Button className="pt-large pt-intent-success gen-btn" iconName="series-derived" onClick={() => this.startFetchingGames(this.unameBoxText)}>Generate</bp.Button>
        </span>
        <hr />
        {this.loading ? (
          <div className="loading-spinner">
            <i>Retrieving games and analysis from lichess...</i>
            <br /><br />
            <bp.Spinner className="pt-large" />

            {this.tempTotalPages > 10 && (<span><br /><br /><i>This player has a lot of games! Sit tight, analysis will take a moment...</i></span>)}

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
                  <a href="#player">Player Info</a> <br />
                  <br />
                  <a href="#rating-summary">Rating Summary</a> <br />
                  <a href="#bullet-ratings">Bullet Rating Chart</a> <br />
                  <a href="#blitz-ratings">Blitz Rating Chart</a> <br />
                  <a href="#rapid-ratings">Rapid Rating Chart</a> <br />
                  <a href="#classical-ratings">Classical Rating Chart</a> <br />
                  <br />
                  <a href="#best-wins">Best Wins</a> <br />
                  <a href="#worst-losses">Worst Losses</a> <br />
                  <a href="#worst-wins">Worst Wins</a> <br />
                  <a href="#best-losses">Best Losses</a> <br />
                  <a href="#most-unexpected-wins">Most Unexpected Wins</a> <br />
                  <a href="#best-draws">Best Draws</a> <br />
                  <br />
                  <a href="#openings">Opening Frequency</a> <br />
                  <a href="#openings-as-white">Opening Frequency as White</a> <br />
                  <a href="#openings-as-black">Opening Frequency as Black</a> <br />
                  <a href="#explore-openings">Personal Opening Explorer</a> <bp.Tag className="pt-intent-warning">Featured!</bp.Tag><br />
                  <br />
                  <a href="#game-length-by-rating-diff">Game Length by Rating Difference</a> <br />

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

                  <div id="rating-summary" />
                  <h3>Rating summary</h3>
                  <table className="pt-table pt-striped pt-bordered">
                    <thead>
                      <tr>
                        <th>Variant</th>
                        <th>Games</th>
                        <th>Rating</th>
                        <th>Deviation</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Bullet</td>
                        <td>{this.userData.perfs.bullet.games} games</td>
                        <td>{this.userData.perfs.bullet.rating}</td>
                        <td>{this.userData.perfs.bullet.rd}</td>
                      </tr>
                      <tr>
                        <td>Blitz</td>
                        <td>{this.userData.perfs.blitz.games} games</td>
                        <td>{this.userData.perfs.blitz.rating}</td>
                        <td>{this.userData.perfs.blitz.rd}</td>
                      </tr>
                      <tr>
                        <td>Rapid</td>
                        <td>{this.userData.perfs.rapid.games} games</td>
                        <td>{this.userData.perfs.rapid.rating}</td>
                        <td>{this.userData.perfs.rapid.rd}</td>
                      </tr>
                      <tr>
                        <td>Classical</td>
                        <td>{this.userData.perfs.classical.games} games</td>
                        <td>{this.userData.perfs.classical.rating}</td>
                        <td>{this.userData.perfs.classical.rd}</td>
                      </tr>
                    </tbody>
                  </table>
                  <hr />

                  <div id="bullet-ratings" />
                  <h3>Standard Chess: Bullet</h3>
                  <h5>Rating progression over time</h5>
                  <ResponsiveContainer width="100%" height={chartHeights}>
                    <AreaChart
                      data={bulletChartData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <XAxis dataKey="lastMoveAt" scale="time" type="number" domain={['dataMin', 'dataMax']} tickFormatter={(timestamp) => {
                        let date = new Date(timestamp);
                        //return date.getMonth() + '/' + date.getDay() + '/' + date.getFullYear();
                        return '' + date;
                      }} />
                      <YAxis domain={['dataMin', 'dataMax']} type="number" scale="linear" />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip label="Rating" labelFormatter={(timestamp) => { return (new Date(timestamp)) + ''; }} />
                      <Area type="monotone" dataKey="ratingAfter" name="Rating" stroke="#8884d8" fill="#8884d8" />
                    </AreaChart>
                  </ResponsiveContainer>
                  <hr />

                  <div id="blitz-ratings" />
                  <h3>Standard Chess: Blitz</h3>
                  <h5>Rating progression over time</h5>
                  <ResponsiveContainer width="100%" height={chartHeights}>
                    <AreaChart
                      data={blitzChartData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <XAxis dataKey="lastMoveAt" scale="time" type="number" domain={['dataMin', 'dataMax']} tickFormatter={(timestamp) => {
                        let date = new Date(timestamp);
                        //return date.getMonth() + '/' + date.getDay() + '/' + date.getFullYear();
                        return '' + date;
                      }} />
                      <YAxis domain={['dataMin', 'dataMax']} type="number" scale="linear" />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip label="Rating" labelFormatter={(timestamp) => { return (new Date(timestamp)) + ''; }} />
                      <Area type="monotone" dataKey="ratingAfter" name="Rating" stroke="#8884d8" fill="#8884d8" />
                    </AreaChart>
                  </ResponsiveContainer>
                  <hr />

                  <div id="rapid-ratings" />
                  <h3>Standard Chess: Rapid</h3>
                  <h5>Rating progression over time</h5>
                  <ResponsiveContainer width="100%" height={chartHeights}>
                    <AreaChart
                      data={rapidChartData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <XAxis dataKey="lastMoveAt" scale="time" type="number" domain={['dataMin', 'dataMax']} tickFormatter={(timestamp) => {
                        let date = new Date(timestamp);
                        //return date.getMonth() + '/' + date.getDay() + '/' + date.getFullYear();
                        return '' + date;
                      }} />
                      <YAxis domain={['dataMin', 'dataMax']} type="number" scale="linear" />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip label="Rating" labelFormatter={(timestamp) => { return (new Date(timestamp)) + ''; }} />
                      <Area type="monotone" dataKey="ratingAfter" name="Rating" stroke="#8884d8" fill="#8884d8" />
                    </AreaChart>
                  </ResponsiveContainer>
                  <hr />

                  <div id="classical-ratings" />
                  <h3>Standard Chess: Classical</h3>
                  <h5>Rating progression over time</h5>
                  <ResponsiveContainer width="100%" height={chartHeights}>
                    <AreaChart
                      data={classicalChartData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <XAxis dataKey="lastMoveAt" scale="time" type="number" domain={['dataMin', 'dataMax']} tickFormatter={(timestamp) => {
                        let date = new Date(timestamp);
                        //return date.getMonth() + '/' + date.getDay() + '/' + date.getFullYear();
                        return '' + date;
                      }} />
                      <YAxis domain={['dataMin', 'dataMax']} type="number" scale="linear" />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip label="Rating" labelFormatter={(timestamp) => { return (new Date(timestamp)) + ''; }} />
                      <Area type="monotone" dataKey="ratingAfter" name="Rating" stroke="#8884d8" fill="#8884d8" />
                    </AreaChart>
                  </ResponsiveContainer>
                  <hr />

                  <div id="best-wins" />
                  <h3>Best Wins</h3>
                  <table className="pt-table pt-bordered pt-striped pt-condensed">
                    <thead>
                      <tr>
                        <th />
                        <th>Opponent</th>
                        <th>(opponent)</th>
                        <th>{this.previouslySelectedUname}</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Opening</th>
                      </tr>
                    </thead>
                    <tbody>
                      {
                        JSON.parse(JSON.stringify(standardGames))
                          .sort((a, b) => b.oppRatingBefore - a.oppRatingBefore)
                          .filter(g => g.weWon && !g.wasDrawn)
                          .slice(0, numGamesInTable)
                          .map((e, i) =>
                            <tr><td>{i + 1}</td>
                              <td>{e.oppName}</td>
                              <td>{e.oppRatingBefore}</td>
                              <td>{e.ourRatingBefore}</td>
                              <td><a href={e.url} target="_blank">{e.simpleStartDate}</a></td>
                              <td>{e.speed}</td>
                              <td>{e.opening.name}</td>
                            </tr>
                          )
                      }
                    </tbody>
                  </table>
                  <hr />

                  <div id="worst-losses" />
                  <h3>Worst Losses</h3>
                  <table className="pt-table pt-bordered pt-striped pt-condensed">
                    <thead>
                      <tr>
                        <th />
                        <th>Opponent</th>
                        <th>(opponent)</th>
                        <th>{this.previouslySelectedUname}</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Opening</th>
                      </tr>
                    </thead>
                    <tbody>
                      {
                        JSON.parse(JSON.stringify(standardGames))
                          .sort((a, b) => a.oppRatingBefore - b.oppRatingBefore)
                          .filter(g => !g.weWon && !g.wasDrawn)
                          .slice(0, numGamesInTable)
                          .map((e, i) =>
                            <tr><td>{i + 1}</td>
                              <td>{e.oppName}</td>
                              <td>{e.oppRatingBefore}</td>
                              <td>{e.ourRatingBefore}</td>
                              <td><a href={e.url} target="_blank">{e.simpleStartDate}</a></td>
                              <td>{e.speed}</td>
                              <td>{e.opening.name}</td>
                            </tr>
                          )
                      }
                    </tbody>
                  </table>
                  <hr />

                  <div id="worst-wins" />
                  <h3>Worst Wins</h3>
                  <table className="pt-table pt-bordered pt-striped pt-condensed">
                    <thead>
                      <tr>
                        <th />
                        <th>Opponent</th>
                        <th>(opponent)</th>
                        <th>{this.previouslySelectedUname}</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Opening</th>
                      </tr>
                    </thead>
                    <tbody>
                      {
                        JSON.parse(JSON.stringify(standardGames))
                          .sort((a, b) => a.oppRatingBefore - b.oppRatingBefore)
                          .filter(g => g.weWon && !g.wasDrawn)
                          .slice(0, numGamesInTable)
                          .map((e, i) =>
                            <tr><td>{i + 1}</td>
                              <td>{e.oppName}</td>
                              <td>{e.oppRatingBefore}</td>
                              <td>{e.ourRatingBefore}</td>
                              <td><a href={e.url} target="_blank">{e.simpleStartDate}</a></td>
                              <td>{e.speed}</td>
                              <td>{e.opening.name}</td></tr>

                          )
                      }
                    </tbody>
                  </table>
                  <hr />

                  <div id="best-losses" />
                  <h3>Best Losses</h3>
                  <table className="pt-table pt-bordered pt-striped pt-condensed">
                    <thead>
                      <tr>
                        <th />
                        <th>Opponent</th>
                        <th>(opponent)</th>
                        <th>{this.previouslySelectedUname}</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Opening</th>
                      </tr>
                    </thead>
                    <tbody>
                      {
                        JSON.parse(JSON.stringify(standardGames))
                          .sort((a, b) => b.oppRatingBefore - a.oppRatingBefore)
                          .filter(g => !g.weWon && !g.wasDrawn)
                          .slice(0, numGamesInTable)
                          .map((e, i) =>
                            <tr><td>{i + 1}</td>
                              <td>{e.oppName}</td>
                              <td>{e.oppRatingBefore}</td>
                              <td>{e.ourRatingBefore}</td>
                              <td><a href={e.url} target="_blank">{e.simpleStartDate}</a></td>
                              <td>{e.speed}</td>
                              <td>{e.opening.name}</td>
                            </tr>
                          )
                      }
                    </tbody>
                  </table>
                  <hr />

                  <div id="most-unexpected-wins" />
                  <h3>Most Unexpected Wins</h3>
                  <h5>Wins with the largest difference in rating</h5>
                  <table className="pt-table pt-bordered pt-striped pt-condensed">
                    <thead>
                      <tr>
                        <th />
                        <th>Opponent</th>
                        <th>(opponent)</th>
                        <th>{this.previouslySelectedUname}</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Opening</th>
                      </tr>
                    </thead>
                    <tbody>
                      {
                        JSON.parse(JSON.stringify(standardGames))
                          .sort((a, b) => a.ratingdiff - b.ratingdiff)
                          .filter(g => g.weWon && !g.wasDrawn)
                          .slice(0, numGamesInTable)
                          .map((e, i) =>
                            <tr><td>{i + 1}</td>
                              <td>{e.oppName}</td>
                              <td>{e.oppRatingBefore}</td>
                              <td>{e.ourRatingBefore}</td>
                              <td><a href={e.url} target="_blank">{e.simpleStartDate}</a></td>
                              <td>{e.speed}</td>
                              <td>{e.opening.name}</td></tr>

                          )
                      }
                    </tbody>
                  </table>
                  <hr />

                  <div id="best-draws" />
                  <h3>Best Draws</h3>
                  <table className="pt-table pt-bordered pt-striped pt-condensed">
                    <thead>
                      <tr>
                        <th />
                        <th>Opponent</th>
                        <th>(opponent)</th>
                        <th>{this.previouslySelectedUname}</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Opening</th>
                      </tr>
                    </thead>
                    <tbody>
                      {
                        JSON.parse(JSON.stringify(standardGames))
                          .sort((a, b) => b.oppRatingBefore - a.oppRatingBefore)
                          .filter(g => g.wasDrawn)
                          .slice(0, numGamesInTable)
                          .map((e, i) =>
                            <tr><td>{i + 1}</td>
                              <td>{e.oppName}</td>
                              <td>{e.oppRatingBefore}</td>
                              <td>{e.ourRatingBefore}</td>
                              <td><a href={e.url} target="_blank">{e.simpleStartDate}</a></td>
                              <td>{e.speed}</td>
                              <td>{e.opening.name}</td></tr>

                          )
                      }
                    </tbody>
                  </table>
                  <hr />

                  <div id="openings" />
                  <h3>Openings</h3>
                  <h5>Openings in all games, by generic name and variation</h5>

                  <span className="flex-span">
                    <table className="pt-table pt-bordered pt-striped pt-condensed">
                      <thead>
                        <tr>
                          <th>Games</th>
                          <th>Opening <i>(generic name)</i></th>
                        </tr>
                      </thead>
                      <tbody>
                        {
                          JSON.parse(JSON.stringify(allShortOpeningsPie)).sort((a, b) => b.games - a.games).map(e =>
                            <tr><td>{e.games}</td><td>{e.shortname}</td></tr>
                          )
                        }
                      </tbody>
                    </table>
                    <ResponsiveContainer width="100%" height={chartHeights * 1.5}>
                      <PieChart>
                        <Pie
                          data={allShortOpeningsPie}
                          nameKey="shortname"
                          dataKey="games"
                          outerRadius={chartHeights * .45}
                          fill="#8884d8"
                          paddingAngle={0}
                        >
                          {
                            allShortOpeningsPie.map((entry, index) => <Cell fill={ecoRangeColors[entry.shortname]} />)
                          }
                        </Pie>
                        <Pie
                          data={allOpeningPie}
                          nameKey="name"
                          dataKey="games"
                          innerRadius={chartHeights * .5}
                          outerRadius={chartHeights * .75}
                          fill="#82ca9d"
                          paddingAngle={0}
                        >
                          {
                            allOpeningPie.map((entry, index) => <Cell fill={ecoRangeColors[entry.shortname]} />)
                          }
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </span>

                  <hr />

                  <div id="openings-as-white" />
                  <h3>Openings as White</h3>
                  <h5>Openings as white, by generic name and variation</h5>

                  <span className="flex-span">
                    <table className="pt-table pt-bordered pt-striped pt-condensed">
                      <thead>
                        <tr>
                          <th>Games</th>
                          <th>Opening <i>(generic name)</i></th>
                        </tr>
                      </thead>
                      <tbody>
                        {
                          JSON.parse(JSON.stringify(whiteShortOpeningsPie)).sort((a, b) => b.games - a.games).map(e =>
                            <tr><td>{e.games}</td><td>{e.shortname}</td></tr>
                          )
                        }
                      </tbody>
                    </table>
                    <ResponsiveContainer width="100%" height={chartHeights * 1.5}>
                      <PieChart>
                        <Pie
                          data={whiteShortOpeningsPie}
                          nameKey="shortname"
                          dataKey="games"
                          outerRadius={chartHeights * .45}
                          fill="#8884d8"
                          paddingAngle={0}
                        >
                          {
                            whiteShortOpeningsPie.map((entry, index) => <Cell fill={ecoRangeColors[entry.shortname]} />)
                          }
                        </Pie>
                        <Pie
                          data={whiteOpeningPie}
                          nameKey="name"
                          dataKey="games"
                          innerRadius={chartHeights * .5}
                          outerRadius={chartHeights * .75}
                          fill="#82ca9d"
                          paddingAngle={0}
                        >
                          {
                            whiteOpeningPie.map((entry, index) => <Cell fill={ecoRangeColors[entry.shortname]} />)
                          }
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </span>


                  <hr />

                  <div id="openings-as-black" />
                  <h3>Openings as Black</h3>
                  <h5>Openings as black, by generic name and variation</h5>

                  <span className="flex-span">
                    <table className="pt-table pt-bordered pt-striped pt-condensed">
                      <thead>
                        <tr>
                          <th>Games</th>
                          <th>Opening <i>(generic name)</i></th>
                        </tr>
                      </thead>
                      <tbody>
                        {
                          JSON.parse(JSON.stringify(blackShortOpeningsPie)).sort((a, b) => b.games - a.games).map(e =>
                            <tr><td>{e.games}</td><td>{e.shortname}</td></tr>
                          )
                        }
                      </tbody>
                    </table>
                    <ResponsiveContainer width="100%" height={chartHeights * 1.5}>
                      <PieChart>
                        <Pie
                          data={blackShortOpeningsPie}
                          nameKey="shortname"
                          dataKey="games"
                          outerRadius={chartHeights * .45}
                          fill="#8884d8"
                          paddingAngle={0}
                        >
                          {
                            blackShortOpeningsPie.map((entry, index) => <Cell fill={ecoRangeColors[entry.shortname]} />)
                          }
                        </Pie>
                        <Pie
                          data={blackOpeningPie}
                          nameKey="name"
                          dataKey="games"
                          innerRadius={chartHeights * .5}
                          outerRadius={chartHeights * .75}
                          fill="#82ca9d"
                          paddingAngle={0}
                        >
                          {
                            blackOpeningPie.map((entry, index) => <Cell fill={ecoRangeColors[entry.shortname]} />)
                          }
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </span>

                  <hr />

                  <div id="explore-openings" />
                  <h3>Personal Opening Explorer</h3>
                  <h5>An opening explorer, generated with statistics for just this player</h5>
                  <ChessBoard />

                  <hr />

                  <div id="game-length-by-rating-diff" />
                  <h3>Game Length by Rating Difference</h3>
                  <h5>Positive rating differences mean you outrated your opponent</h5>
                  <ResponsiveContainer width="100%" height={chartHeights}>
                    <ScatterChart height={chartHeights} margin={{ top: 20, right: 0, left: 20, bottom: 20 }}>
                      <XAxis dataKey="ratingdiff" unit="" name="Rating Difference" scale="linear" type="number" >
                        <Label value="Rating Difference" position="bottom" offset={0} />
                      </XAxis>
                      <YAxis dataKey="turns" unit="" name="Ply" scale="linear" type="number"  >
                        <Label value="Ply" position="left" offset={0} />
                      </YAxis>
                      <CartesianGrid strokeDasharray="3 3" />
                      <Scatter name="Win" data={standardGames.filter(g => g.weWon && !g.wasDrawn).sort((a, b) => a.ratingdiff - b.ratingdiff)} fill="#5BB832" />
                      <Scatter name="Draw" data={standardGames.filter(g => g.wasDrawn).sort((a, b) => a.ratingdiff - b.ratingdiff)} fill="#FAC200" />
                      <Scatter name="Loss" data={standardGames.filter(g => !g.weWon && !g.wasDrawn).sort((a, b) => a.ratingdiff - b.ratingdiff)} fill="#EA3817" />
                      <Legend verticalAlign="top" />
                      <Tooltip />
                    </ScatterChart>
                  </ResponsiveContainer>

                  <hr />

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
      { with_analysis: 1, rated: 1, with_opening: 1, nb: 100, page: 1, with_moves: 1, with_movetimes: 1 },
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
      { with_analysis: 1, rated: 1, with_opening: 1, nb: 100, page: currPage, with_moves: 1, with_movetimes: 1 },
      (err: string, games: string) => {
        let pageData = JSON.parse(games);
        this.allGames = this.allGames.concat(pageData.currentPageResults);
        this.fetchGamePage(currPage + 1, numPages, uname);
      }
    );
  }

  fetchGamesComplete() {
    this.allGames.reverse(); // Reverse the array, since recent games are first
    this.allGames.filter(g => g.status != "NoStart" || g.status != "Aborted" || g.status != "nostart" || g.status != "aborted"); // Remove games that didn't even start
    this.allGames.filter(g => g.status != "Created" || g.status != "Started" || g.status != "created" || g.status != "started"); // Remove games that haven't finished yet
    this.allGames.forEach(game => {
      // Calculate the ending rating
      let rating: number;
      if (game.players.black.userId.toUpperCase() === this.previouslySelectedUname.toUpperCase()) {
        rating = game.players.black.rating + game.players.black.ratingDiff;
        game['ourSide'] = 'black';
        game['oppName'] = game.players.white.userId;
        game['ourRatingBefore'] = game.players.black.rating;
        game['oppRatingBefore'] = game.players.white.rating;
      } else {
        rating = game.players.white.rating + game.players.white.ratingDiff;
        game['ourSide'] = 'white';
        game['oppName'] = game.players.black.userId;
        game['ourRatingBefore'] = game.players.white.rating;
        game['oppRatingBefore'] = game.players.black.rating;
      }
      game['ratingAfter'] = rating;
      game['weWon'] = (game.ourSide === game.winner);
      // Calculate the ending datetime
      let enddate = new Date(game.lastMoveAt);
      game['enddate'] = '' + enddate;
      game['ratingdiff'] = game.ourRatingBefore - game.oppRatingBefore;
      game['wasDrawn'] = (game.status === 'Draw' || game.status === 'Stalemate' || game.status === 'draw' || game.status === 'stalemate');
      let startDate = new Date(game.createdAt);
      game['simpleStartDate'] = '' + startDate.getMonth() + '/' + startDate.getDate() + '/' + startDate.getFullYear();
    });
    console.log(this.allGames);
    this.loading = false;
    this.forceUpdate();
  }

}

export default App;
