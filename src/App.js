import React from "react";
import logo from './logo.svg';
import './App.css';
import { geolocated } from "react-geolocated";
import axios from 'axios';

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

function getDistanceFromLatLonInM(lat1,lon1,lat2,lon2) {
  var R = 6371;
  var dLat = deg2rad(lat2-lat1);
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c * 1000;
  return d;
}

function guidGenerator() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

class GeoFence extends React.Component {
  constructor(props) {
    super(props);
    this.state = { radius: 500, out_range: 0, latitude: 0, longitude: 0 }
  }
  async componentDidMount() {
    var user = localStorage.getItem('user');
    if (!user && this.props.coords) {
      var id = guidGenerator();
      localStorage.setItem('user', id);
      var config = {
        method: 'get',
        url: `https://manish-geofence-api.herokuapp.com/users/create?user_id=${id}&latitude=${this.props.coords.latitude}&longitude=${this.props.coords.longitude}`,
        headers: { }
      };

      const res = await axios(config);
      console.log(res);
    }
    var config2 = {
      method: 'get',
      url: 'https://manish-geofence-api.herokuapp.com/users/get_user?user_id='+localStorage.getItem('user'),
      headers: { }
    };

    const response = await axios(config2);
    console.log(JSON.stringify(response.data));
    this.setState({ ...this.state, latitude: response.data.latitude, longitude: response.data.longitude, radius: localStorage.getItem('radius') ? localStorage.getItem('radius') : 500 })
    setInterval(() => {
      console.log(this.props.coords);
      var dist = getDistanceFromLatLonInM(response.data.latitude, response.data.longitude, this.props.coords.latitude, this.props.coords.longitude);
      this.setState({ ...this.state, out_range: dist });
    }, 1000);
    
  }
  render() {
    return (
      <div className="container">
          <div className="App" style={{marginBottom: 80}}>
              <button className="button button_color" onClick={() => {
                localStorage.setItem('location', JSON.stringify({'latitude': this.props.coords.latitude, 'longitude': this.props.coords.longitude}) );
              }}>Update Center Location</button>
          </div>
          <div className="input-field">
            <input id="password" placeholder="Tracking Radius" />
            <button type="submit"><i className="fas fa-chevron-right"></i>
            </button>
          </div>
          <div className="App">
              <button className="button button_color" onClick={() => {
                this.setState({ ...this.state, radius: document.getElementById("password").value })
                localStorage.setItem('radius', document.getElementById("password").value );
              }}>Save</button>
          </div>
          <div className='range-message'>
            Latitude: {this.state.latitude}
          </div>
          <div className='range-message'>
            Longitude: {this.state.longitude}
          </div>
          {this.state.out_range <= this.state.radius ? (<div className='range-message'>
              You are in range!
            </div>
          ) : (
          <div className='range-message'>
              Out of Range!
            </div>)}
      </div>
    )
  }
}

class App extends React.Component {
  render() {
    return !this.props.isGeolocationAvailable ? (
            <div>Your browser does not support Geolocation</div>
        ) : !this.props.isGeolocationEnabled ? (
            <div className="App">
              <button className="button button_shake">Give location access to go ahead!</button>
            </div>
        ) : this.props.coords ? (
      <div className="App">
        <GeoFence coords={this.props.coords} />
      </div>
    ) : (
            <div>Getting the location data&hellip; </div>
        );
  }
}

export default geolocated({
    positionOptions: {
        enableHighAccuracy: false,
    },
    userDecisionTimeout: 5000,
})(App);
