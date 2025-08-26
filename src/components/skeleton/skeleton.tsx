import {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated} from 'react-native';
import {LinearGradient} from 'react-native-linear-gradient'; 

const Skeleton = ({width = 200, height = 20, borderRadius = 8}) => {
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={[styles.skeleton, {width, height, borderRadius}]}>
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          transform: [{translateX}],
        }}>
        <LinearGradient
          colors={['#E1E9EE', '#F2F8FC', '#E1E9EE']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={{flex: 1}}
        />
      </Animated.View>
    </View>
  );
};

export default Skeleton;

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E1E9EE', 
    overflow: 'hidden',
    marginVertical: 6,
  },
});