  import React, { useState, useRef, useEffect } from 'react';
  import { View, Text, TouchableOpacity, Animated, StyleSheet, Image, PanResponder  } from 'react-native';

  const tabs = [
    { 
      id: 1, 
      iconActive: require('../assets/images/icon_schedule.png'),
      iconInactive: require('../assets/images/icon_schedule.png'),
      label: "Календарь",
    },
    { 
      id: 2, 
      iconActive: require('../assets/images/icon_home.png'),
      iconInactive: require('../assets/images/icon_home.png'),
      label: "Главная",
    },
    { 
      id: 3, 
      iconActive: require('../assets/images/icon_profile.png'),
      iconInactive: require('../assets/images/icon_profile.png'),
      label: "Профиль",
    },
    { 
      id: 4, 
      iconActive: require('../assets/images/icon_social.png'),
      iconInactive: require('../assets/images/icon_social.png'),
      label: "Соц Сети",
    },
  ];

  const profiles = [
    {
      id: 11, 
      profileIcon: require('../assets/images/icon_profile.png'),
      label: "Челикс1",
    },
    {
      id: 12, 
      profileIcon: require('../assets/images/icon_profile.png'),
      label: "Челикс2",
    },
  ]

  const App = () => {
    const [activeTab, setActiveTab] = useState(1);
  const [prevTab, setPrevTab] = useState(1);
  const [direction, setDirection] = useState('right');
  const fadeOutAnim = useRef(new Animated.Value(1)).current;
  const slideOutAnim = useRef(new Animated.Value(0)).current;
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const currentIndex = useRef(1);
  
  const scaleAnimations = useRef(
    tabs.map(() => new Animated.Value(1))
  ).current;

  // Добавляем PanResponder для обработки свайпов
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        swipeAnim.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx } = gestureState;
        if (Math.abs(dx) > 50) {
          const newIndex = dx > 0 
            ? Math.max(1, currentIndex.current - 1) 
            : Math.min(tabs.length, currentIndex.current + 1);
          
          handleSwipe(newIndex);
        } else {
          Animated.spring(swipeAnim, {
            toValue: 0,
            useNativeDriver: true
          }).start();
        }
      }
    })
  ).current;

  const handleSwipe = (newIndex) => {
    const tabId = tabs[newIndex - 1].id;
    const newDirection = tabId > activeTab ? 'right' : 'left';
    
    Animated.parallel([
      Animated.spring(swipeAnim, {
        toValue: 0,
        useNativeDriver: true
      }),
    ]).start(() => {
      handleTabPress(tabId);
      currentIndex.current = newIndex;
    });
  };

  const handleTabPress = (tabId) => {
    if (tabId === activeTab) return;

    const newDirection = tabId > activeTab ? 'right' : 'left';
    const prevIndex = tabs.findIndex(t => t.id === activeTab);
    const newIndex = tabs.findIndex(t => t.id === tabId);

    Animated.parallel([
      Animated.spring(scaleAnimations[prevIndex], {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnimations[newIndex], {
        toValue: 1.3,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPrevTab(activeTab);
      setActiveTab(tabId);
      fadeOutAnim.setValue(1);
      slideOutAnim.setValue(0);
    });
    Animated.parallel([
      Animated.timing(fadeOutAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideOutAnim, {
        toValue: newDirection === 'right' ? -100 : 100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPrevTab(activeTab);
      setActiveTab(tabId);
      fadeOutAnim.setValue(1);
      slideOutAnim.setValue(0); 
    });
  };
    //Функция рендер контента для каждого id
    const handleData = (tab_id) => {
      const commonContentStyle = {
        opacity: fadeOutAnim,
        transform: [{ translateX: slideOutAnim }],
        width: '100%', // Добавляем полную ширину
        alignItems: 'center', // Центрируем содержимое
      };
    
      switch(tab_id) {
        case 1:
          // <Animated.View style={[styles.content, commonContentStyle]}>
          //     <Text style={[styles.tabText, { textAlign: 'center' }]}>
          //       {tabs.find(t => t.id === activeTab).label}
          //     </Text>
          //   </Animated.View>
        case 2:
          // <Animated.View style={[styles.content, commonContentStyle]}>
          //     <Text style={[styles.tabText, { textAlign: 'center' }]}>
          //       {tabs.find(t => t.id === activeTab).label}
          //     </Text>
          // </Animated.View>
        case 3:
          return (
            <Animated.View style={[styles.content, commonContentStyle]}>
              <Text style={[styles.tabText, { textAlign: 'center' }]}>
                {tabs.find(t => t.id === activeTab).label}
              </Text>
            </Animated.View>
          );
        case 4:
          return (
            <Animated.View style={[styles.content, commonContentStyle]}>
              {profiles.map((profilez) => (
                <View key={profilez.id} style={styles.profileContainer}>
                  <Image
                    source={profilez.profileIcon}
                    style={styles.profileIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.tabText}>{profilez.label}</Text>
                </View>
              ))}
            </Animated.View>
          );
        default:
          return null;
        }
    }
    return (
      <View style={styles.container}>
        <View style={styles.topBar}></View>
        {/* Контент для рендера */}
        <Animated.View 
          style={[
            styles.contentContainer,
            {
              transform: [{ translateX: swipeAnim }],
              opacity: fadeOutAnim
            }
          ]}
          {...panResponder.panHandlers}
          >
          {handleData(activeTab)}
      </Animated.View>
        {/* Панель вкладок */}
        <View style={styles.tabBar}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab,
            ]}
            onPress={() => handleTabPress(tab.id)}>
            <Animated.View 
              style={[
                styles.iconContainer,
                activeTab === tab.id && styles.activeIconContainer,
                { 
                  transform: [{ scale: scaleAnimations[index] }],
                  shadowOpacity: activeTab === tab.id ? 0.3 : 0 
                }
              ]}>
              <Image
                source={activeTab === tab.id ? tab.iconActive : tab.iconInactive}
                style={[
                  styles.icon,
                  activeTab === tab.id && styles.activeIcon
                ]}
                resizeMode="contain"
              />
            </Animated.View>
          </TouchableOpacity>
        ))}
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    topBar: {
      flex: 0,
      alignItems: 'center',
      padding: 16,
      backgroundColor: '#787D46',
      height:40,
    },
    container: {
      flex: 1,
      backgroundColor: '#F1EBD8',
      width: 490,
      borderRadius: 30,
      overflow: 'hidden',
    },
    contentContainer: {
      flex: 1,
      width: '100%',
      textAlign:'center',
      justifyContent:'center',
      paddingHorizontal: 20,
    },
    content: {
      width: '80%',
    },
    profileContainer: {
      width: '100%',
      backgroundColor: "#BF9C59",
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      marginVertical: 5,
      borderRadius: 10,
    },
    profileImageContainer: {
      backgroundColor: '#AD6E6E',
      width: 40,
      height: 40,
      borderRadius: "50%",
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      top: -25,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    activeIcon: {
      tintColor: '#7D4E25',
    },
    profileIcon: {
      width: 24,
      height: 24,
      marginRight: 15,
      tintColor: '#7D4E25',
    },
    tabText: {
      color: '#000000',
      fontSize: 18,
      fontWeight: '500',
    },
    tabBar: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: '#ddd',
      borderBottomStartRadius: 100,
      borderBottomEndRadius: 100,
      overflow: 'visible',
      height: 60,
    },
    activeTab: {
      // backgroundColor: '#fff',
      borderTopWidth: 2,
      borderTopColor: '#007AFF',
      zIndex: 2,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      padding: 16,
      backgroundColor: '#787D46',
      position: 'relative',
      overflow: 'visible',
    },
    iconContainer: {
      backgroundColor: '#BF9C59',
      width: 60,
      height: 60,
      borderRadius: "50%",
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      top: -20,
    },
    icon: {
      width: 32,
      height: 32,
      tintColor: '#7D4E25',
    },
    activeIconContainer: {
      backgroundColor: '#E4BA6A',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 5,
    },
  });

  export default App;