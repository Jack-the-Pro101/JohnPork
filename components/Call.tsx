import {useEffect, useRef, useState} from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {Camera, useCameraDevices} from 'react-native-vision-camera';

import LiveAudioStream from 'react-native-live-audio-stream';
import Sound from 'react-native-sound';

const options = {
  sampleRate: 32000,
  channels: 1,
  bitsPerSample: 16,
  audioSource: 6,
  wavFile: '',
};

LiveAudioStream.init(options);

const androidMicPermission = PERMISSIONS.ANDROID.RECORD_AUDIO;
const iosMicPermission = PERMISSIONS.IOS.MICROPHONE;

async function requestPermissions(
  os: 'ios' | 'android',
  callbackMic: (authorized: boolean) => void,
  callbackCam: (authorized: boolean) => void,
) {
  const permission = os === 'ios' ? iosMicPermission : androidMicPermission;

  let micGranted = false;
  let camGranted = false;

  if (
    (await check(permission)) === RESULTS.GRANTED ||
    (await request(permission)) === RESULTS.GRANTED
  ) {
    callbackMic(true);
    micGranted = true;
  } else {
    callbackMic(false);
  }

  if (
    (await Camera.getCameraPermissionStatus()) === 'authorized' ||
    (await Camera.requestCameraPermission()) === 'authorized'
  ) {
    callbackCam(true);
    camGranted = true;
  } else {
    callbackCam(false);
  }

  return {
    mic: micGranted,
    cam: camGranted,
  };
}

const fakeCamShakeScaleFactor = 0.2;

export default function Call({
  setCallStatus,
}: {
  setCallStatus: (inCall: boolean) => void;
}) {
  const [hasMicPerms, setHasMicPerms] = useState(false);
  const [hasCamPerms, setHasCamPerms] = useState(false);
  const [camActive, setCamActive] = useState(true);
  const [muted, setMuted] = useState(false);

  const [fakeLoading, setFakeLoading] = useState(true);

  const camDevices = useCameraDevices();
  const camDevice = camDevices.front;

  useEffect(() => {
    (async () => {
      let micGranted = false;
      let camGranted = false;

      if (Platform.OS === 'android') {
        micGranted = (
          await requestPermissions('android', setHasMicPerms, setHasCamPerms)
        ).mic;
      } else if (Platform.OS === 'ios') {
        camGranted = (
          await requestPermissions('ios', setHasMicPerms, setHasCamPerms)
        ).cam;
      } else {
      }

      async function playOink() {
        const random = Math.floor(Math.random() * 7) + 1;

        const oink = new Sound(`oink_${random}.mp3`, Sound.MAIN_BUNDLE, err => {
          if (err) console.error(err);
        });

        await new Promise(resolve => {
          const checkLoaded = setInterval(() => {
            if (oink.isLoaded()) {
              clearInterval(checkLoaded);
              resolve(true);
            }
          }, 50);
        });

        oink.play();

        setTimeout(() => {
          oink.release();
          playOink();
        }, oink.getDuration() * 1000 + Math.floor(Math.random() * 5000));
      }

      playOink();
    })();

    setTimeout(() => {
      setFakeLoading(false);
    }, Math.max(Math.floor(Math.random() * 2000), 350));
  }, []);

  const fakeCamMoveAnim = useRef(
    new Animated.ValueXY({
      x: 0,
      y: 0,
    }),
  ).current;

  useEffect(() => {
    const maxX = (Dimensions.get('screen').width * fakeCamShakeScaleFactor) / 8;
    const maxY =
      (Dimensions.get('screen').height * fakeCamShakeScaleFactor) / 8;

    function shakeCam() {
      const moveX =
        Math.floor(Math.random() * maxX) *
        (Math.floor(Math.random() * 2) === 1 ? -1 : 1);
      const moveY =
        Math.floor(Math.random() * maxY) *
        (Math.floor(Math.random() * 2) === 1 ? -1 : 1);
      const moveTime = Math.max(Math.floor(Math.random() * 700), 180);

      Animated.timing(fakeCamMoveAnim, {
        toValue: {
          x: moveX,
          y: moveY,
        },
        easing: Easing.ease,
        duration: moveTime,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        shakeCam();
      }, Math.floor(Math.random() * 100) + moveTime);
    }

    shakeCam();
  }, [fakeCamMoveAnim]);

  return (
    <SafeAreaView style={styles.body}>
      <>
        {camDevice == null ? (
          <View></View>
        ) : (
          <Camera
            device={camDevice}
            style={styles.camera}
            isActive={camActive}
          />
        )}

        {fakeLoading ? (
          <View style={styles.fakeLoad}>
            <Text style={styles.fakeLoadText}>Connecting...</Text>
          </View>
        ) : null}

        <Animated.Image
          source={require('../assets/images/JohnPorkBg.png')}
          style={{
            ...styles.johnPork,
            transform: [
              {
                translateX: fakeCamMoveAnim.x,
              },
              {
                translateY: fakeCamMoveAnim.y,
              },
              {
                scale: 1 + fakeCamShakeScaleFactor,
              },
            ],
          }}
        />

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              BackHandler.exitApp();
              setCallStatus(false);
            }}>
            <Image
              source={require('../assets/images/CallDecline.png')}
              style={styles.icon}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={{...styles.button, ...styles.muteBtn}}
            disabled={!hasMicPerms}
            onPress={() => setMuted(muted => !muted)}>
            <Image
              source={
                muted || !hasMicPerms
                  ? require('../assets/images/Muted.png')
                  : require('../assets/images/Mute.png')
              }
              style={styles.muteIcon}
            />
          </TouchableOpacity>
        </View>
      </>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
  },

  fakeLoad: {
    position: 'absolute',
    zIndex: 3,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'black',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },

  fakeLoadText: {
    color: 'white',
    fontSize: 20,
  },

  johnPork: {
    height: '100%',
  },

  buttons: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    bottom: 24,
    right: 0,
    left: 0,
    zIndex: 4,
    paddingHorizontal: 24,
  },

  button: {},

  muteBtn: {
    borderWidth: 1,
    borderColor: 'white',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 36,
    padding: 10,
  },

  icon: {
    width: 72,
    height: 72,
  },

  muteIcon: {
    width: 52,
    height: 52,
  },

  camera: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 100,
    height: 160,
    borderRadius: 4,
    zIndex: 5,
  },
});
