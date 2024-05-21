import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Button, FlatList, TouchableOpacity, Text } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import axios from 'axios';

const MapScreen = () => {
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords, setToCoords] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);

  const getCoordinates = async (place, setCoords) => {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: place,
        format: 'json',
      },
    });
    if (response.data.length > 0) {
      const coords = response.data[0];
      setCoords({ latitude: parseFloat(coords.lat), longitude: parseFloat(coords.lon) });
    }
  };

  const getDirections = async (from, to) => {
    const response = await axios.get(`https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}`, {
      params: {
        overview: 'full',
        geometries: 'geojson',
      },
    });
    const coordinates = response.data.routes[0].geometry.coordinates.map(coord => ({
      latitude: coord[1],
      longitude: coord[0],
    }));
    setRouteCoordinates(coordinates);
  };

  const handleGetDirections = async () => {
    if (fromLocation && toLocation) {
      await getCoordinates(fromLocation, setFromCoords);
      await getCoordinates(toLocation, setToCoords);
      if (fromCoords && toCoords) {
        await getDirections(fromCoords, toCoords);
      }
    }
  };

  const fetchSuggestions = async (query, setSuggestions) => {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query,
        format: 'json',
        addressdetails: 1,
      },
    });
    setSuggestions(response.data);
  };

  const handleSelectSuggestion = (suggestion, setLocation, setCoords, setSuggestions) => {
    setLocation(suggestion.display_name);
    setCoords({ latitude: parseFloat(suggestion.lat), longitude: parseFloat(suggestion.lon) });
    setSuggestions([]);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="From"
        value={fromLocation}
        onChangeText={(text) => {
          setFromLocation(text);
          fetchSuggestions(text, setFromSuggestions);
        }}
      />
      {fromSuggestions.length > 0 && (
        <FlatList
          data={fromSuggestions}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleSelectSuggestion(item, setFromLocation, setFromCoords, setFromSuggestions)}>
              <Text style={styles.suggestion}>{item.display_name}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.place_id}
          style={styles.suggestionsContainer}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="To"
        value={toLocation}
        onChangeText={(text) => {
          setToLocation(text);
          fetchSuggestions(text, setToSuggestions);
        }}
      />
      {toSuggestions.length > 0 && (
        <FlatList
          data={toSuggestions}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleSelectSuggestion(item, setToLocation, setToCoords, setToSuggestions)}>
              <Text style={styles.suggestion}>{item.display_name}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.place_id}
          style={styles.suggestionsContainer}
        />
      )}
      <Button title="Get Directions" onPress={handleGetDirections} />
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {fromCoords && <Marker coordinate={fromCoords} />}
        {toCoords && <Marker coordinate={toCoords} />}
        {routeCoordinates.length > 0 && (
          <Polyline coordinates={routeCoordinates} strokeWidth={2} strokeColor="red" />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 50,
  },
  map: {
    width: '100%',
    height: '70%',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    margin: 10,
    padding: 10,
    backgroundColor: 'white',
    width: '90%',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 90,
    left: 10,
    right: 10,
    backgroundColor: 'white',
    zIndex: 1,
  },
  suggestion: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
  },
});

export default MapScreen;
