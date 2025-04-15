import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Image, PanResponder, TextInput, Button } from 'react-native';
import { tabs, profiles } from './constants/';
import axios from "axios";

const API_URL = "http://127.0.0.1:8000"

const App = () => {

  const [activeTab, setActiveTab] = useState(1);
  const [prevTab, setPrevTab] = useState(1);
  const [direction, setDirection] = useState('right');
  const fadeOutAnim = useRef(new Animated.Value(1)).current;
  const slideOutAnim = useRef(new Animated.Value(0)).current;
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const currentIndex = useRef(1);
  const [users, setUsers] = useState([])
  const [registrationStatus, setRegistrationStatus] = useState('');
  const [loginStatus, setLoginStatus] = useState('');
  const [isLoginForm, setIsLoginForm] = useState(true);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/`);
      setUsers(response.data);
    } catch (err) {
      console.error('Ошибка:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // форма регистрации
  const handleLogin = async () => {
    if (!loginUsername || !loginPassword) {
      setLoginStatus('Введите имя пользователя и пароль');
      return;
    }
  
    try {
      setLoginStatus('Вход...');
      
      // POST запрос для аутентификации
      const loginResponse = await axios.post(`${API_URL}/login/`, {
        username: loginUsername,
        password: loginPassword
      });
      // GET запрос для получения полных данных профиля
      const profileResponse = await axios.get(
        `${API_URL}/users/${loginResponse.data.id}`
      );
  
      setLoginStatus('Успешный вход!');
      setIsLoggedIn(true);
      setCurrentUser({
        ...profileResponse.data,
        created_at: new Date(profileResponse.data.created_at).toLocaleDateString()
      });
      
      setLoginUsername('');
      setLoginPassword('');
  
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Ошибка сервера';
      setLoginStatus(`Ошибка: ${message}`);
    }
  };
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setLoginStatus('');
  };
  const handleRegister = async () => {
    if (!regUsername || !regEmail || !regPassword) {
      setRegistrationStatus('Все поля обязательны для заполнения');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(regEmail)) {
      setRegistrationStatus('Некорректный формат email');
      return;
    }

    try {
      setRegistrationStatus('Отправка данных...');

      await axios.post(`${API_URL}/register/`, {
        username: regUsername,
        email: regEmail,
        password: regPassword
      });

      setRegistrationStatus('Регистрация успешна!');
      setRegUsername('');
      setRegEmail('');
      setRegPassword('');

      await fetchUsers();

    } catch (error: any) {
      const message = error.response?.data?.detail || 'Ошибка сервера';
      setRegistrationStatus(`Ошибка: ${message}`);
    }
  };
  const scaleAnimations = useRef(
    tabs.map(() => new Animated.Value(1))
  ).current;
  

  // Здесь должна быть логика свайпов
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

  // ещё одна функция обработки свайпов
  const handleSwipe = (newIndex: any) => {
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


  // Обработка нажатий
  const handleTabPress = (tabId: number) => {
    if (tabId === activeTab) return;
  
    const prevIndex = tabs.findIndex(t => t.id === activeTab);
    const newIndex = tabs.findIndex(t => t.id === tabId);
    const newDirection = tabId > activeTab ? 'right' : 'left';
  
    // Анимации масштаба и смещения вместе
    Animated.parallel([
      // Масштаб
      Animated.spring(scaleAnimations[prevIndex], {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnimations[newIndex], {
        toValue: 1.3,
        useNativeDriver: true,
      }),
      // Прозрачность и смещение
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
      setActiveTab(tabId); // ОДИН вызов
      setPrevTab(activeTab);
      fadeOutAnim.setValue(1);
      slideOutAnim.setValue(0);
    });
  };

  // Общие стили в рендере кейсов
  const commonContentStyle = {
    opacity: fadeOutAnim,
    transform: [{ translateX: slideOutAnim }],
    width: '100%',
    alignItems: 'center',
  };

  //Функция рендер контента для каждого id
  const handleData = (tab_id: any) => {
    switch (tab_id) {
      case 1:
        return (
        <View>
              <Text style={styles.formTitle}>Профили</Text>
        </View>)
      case 2:
        return (
          <Animated.View style={[styles.content, commonContentStyle]}>
            {isLoggedIn ? (
              // Контент для авторизованного пользователя
              <View style={styles.profileContent}>
                <Text style={styles.welcomeText}>
                  Добро пожаловать, {currentUser?.username}!
                </Text>
                <View style={styles.userInfo}>
                  <Text>Email: {currentUser?.email}</Text>
                  <Text>Дата регистрации: {currentUser?.created_at}</Text>
                </View>
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={handleLogout}>
                  <Text style={styles.buttonText}>Выйти</Text>
                </TouchableOpacity>
              </View>
            ) : isLoginForm ? (
              // Форма входа
              <>
                <Text style={styles.formTitle}>Вход</Text>
                
                <TextInput
                  style={styles.input}
                  placeholder="Имя пользователя"
                  value={loginUsername}
                  onChangeText={setLoginUsername}
                  autoCapitalize="none"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Пароль"
                  secureTextEntry
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                />

                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={handleLogin}
                  disabled={!loginUsername || !loginPassword}>
                  <Text style={styles.buttonText}>Войти</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.switchFormButton}
                  onPress={() => setIsLoginForm(false)}>
                  <Text style={styles.switchFormText}>Нет аккаунта? Зарегистрироваться</Text>
                </TouchableOpacity>

                {loginStatus && (
                  <Text style={[styles.statusText, loginStatus.includes('Ошибка') && styles.errorText]}>
                    {loginStatus}
                  </Text>
                )}
              </>
            ) : (
              // Форма регистрации
              <>
                <Text style={styles.formTitle}>Регистрация</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Имя пользователя"
                  value={regUsername}
                  onChangeText={setRegUsername}
                  autoCapitalize="none"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  keyboardType="email-address"
                  value={regEmail}
                  onChangeText={setRegEmail}
                  autoCapitalize="none"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Пароль"
                  secureTextEntry
                  value={regPassword}
                  onChangeText={setRegPassword}
                />

                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={handleRegister}
                  disabled={!regUsername || !regEmail || !regPassword}>
                  <Text style={styles.buttonText}>Зарегистрироваться</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.switchFormButton}
                  onPress={() => setIsLoginForm(true)}>
                  <Text style={styles.switchFormText}>Уже есть аккаунт? Войти</Text>
                </TouchableOpacity>

                {registrationStatus && (
                  <Text style={[styles.statusText, registrationStatus.includes('Ошибка') && styles.errorText]}>
                    {registrationStatus}
                  </Text>
                )}
              </>
            )}
          </Animated.View>
        );
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
        {tabs.map((tab: any, index: any) => (
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
  formTitle: {
    fontSize: 24,
    color: '#7D4E25',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    height: 50,
    borderColor: '#BF9C59',
    borderWidth: 2,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 25,
    width: '100%',
    backgroundColor: '#FFF',
  },
  registerButton: {
    backgroundColor: '#787D46',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF4444',
  },
  topBar: {
    flex: 0,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#787D46',
    height: 40,
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
    textAlign: 'center',
    justifyContent: 'center',
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
    borderRadius: 30,
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
    borderRadius: 30,
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
  statusText: {
    color: '#787D46',
    marginTop: 10,
    fontSize: 16
  },
  switchFormButton: {
    marginTop: 15,
  },
  switchFormText: {
    color: '#7D4E25',
    textDecorationLine: 'underline',
  },
  profileContent: {
    width: '100%',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 22,
    color: '#7D4E25',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    backgroundColor: '#BF9C59',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#AD6E6E',
    padding: 15,
    borderRadius: 25,
    width: '50%',
    alignItems: 'center',
  },
});

export default App;