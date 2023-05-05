import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  Image,
  StatusBar,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Text,
  Vibration,
  useColorScheme,
  ImageBackground,
  View,
  BackHandler,
} from 'react-native';

// Suppress warning message from outdated dependency
import {LogBox} from 'react-native';
LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message

import Sound from 'react-native-sound';
import Call from './components/Call';

const ringtone = new Sound('john_pork_call.mp3', Sound.MAIN_BUNDLE, err => {
  if (err) {
    console.error('Failed to load ringtone');
    throw new Error(err);
  }
});

Sound.setCategory('Playback');

const VIBRATE_PATTERN = [1000, 1000];

function stopRinging() {
  ringtone.stop();
  Vibration.cancel();
}

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [inCall, setInCall] = useState(false);

  useEffect(() => {
    (async () => {
      await new Promise((resolve, reject) => {
        const checkLoaded = setInterval(() => {
          if (ringtone.isLoaded()) {
            clearInterval(checkLoaded);
            resolve(true);
          }
        }, 2);
      });

      ringtone.setCurrentTime(0);
      ringtone.setSpeed(1);
      ringtone.setPitch(1);
      ringtone.setVolume(1);
      ringtone.setNumberOfLoops(-1);
      ringtone.play();

      Vibration.vibrate(VIBRATE_PATTERN, true);
    })();

    return stopRinging;
  }, []);

  return !inCall ? (
    <SafeAreaView style={styles.body}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ImageBackground
        source={require('./assets/images/JohnPork.png')}
        resizeMode="cover"
        style={{flex: 1, justifyContent: 'space-between', padding: 16}}>
        <View style={styles.body}>
          <View style={styles.texts}>
            <Text style={{...styles.text, ...styles.title}}>John Pork</Text>
            <Text style={{...styles.text, ...styles.subtitle}}>
              is calling...
            </Text>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => {
                stopRinging();
                BackHandler.exitApp();
              }}>
              <Image
                source={require('./assets/images/CallDecline.png')}
                style={styles.callIcon}
              />

              <Text style={styles.callText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => {
                stopRinging();
                setInCall(true);
              }}>
              <Image
                source={require('./assets/images/CallAccept.png')}
                style={styles.callIcon}
              />

              <Text style={styles.callText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  ) : (
    <Call setCallStatus={setInCall} />
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },

  texts: {
    paddingTop: 42,
  },

  text: {
    textAlign: 'center',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 12,
  },

  title: {
    fontWeight: '600',
    fontSize: 38,
  },

  subtitle: {
    fontSize: 24,
    fontWeight: '400',
  },

  buttons: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 24,
    marginTop: 'auto',
  },

  callButton: {
    display: 'flex',
    alignItems: 'center',
  },

  callIcon: {
    width: 84,
    height: 84,
  },

  callText: {
    fontSize: 18,
    textShadowColor: 'rgba(0,0,0,0.5)',
    fontWeight: '500',
    marginTop: 8,
    textShadowRadius: 8,
  },
});

export default App;
