import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Image, PanResponder, TextInput, ScrollView, Platform, Modal } from 'react-native';
import { tabs } from './constants/';
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, DateData } from 'react-native-calendars';
import { format, parseISO, parse, isDate, isValid, setHours, setMinutes, setSeconds, setMilliseconds, isAfter } from 'date-fns';

const API_URL = "http://127.0.0.1:8000";
const CACHE_KEY_USERS = '@cached_users';
const CACHE_KEY_HOBBIES = '@cached_hobbies';
const CACHE_KEY_SCHEDULED_HOBBIES = '@cached_scheduled_hobbies';

const App = () => {
  const [activeTab, setActiveTab] = useState(1);
  const fadeOutAnim = useRef(new Animated.Value(1)).current;
  const slideOutAnim = useRef(new Animated.Value(0)).current;
  const swipeAnim = useRef(new Animated.Value(0)).current;

  const [users, setUsers] = useState([]);
  const [hobbies, setHobbies] = useState([]);
  const [scheduledHobbies, setScheduledHobbies] = useState({});
  const [scheduledHobbiesList, setScheduledHobbiesList] = useState([]);
  const [schedulingForHobby, setSchedulingForHobby] = useState(null);

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

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingHobbies, setLoadingHobbies] = useState(true);
  const [loadingScheduledHobbies, setLoadingScheduledHobbies] = useState(true);

  const [hobbyName, setHobbyName] = useState('');
  const [hobbyDescription, setHobbyDescription] = useState('');
  const [hobbyCategory, setHobbyCategory] = useState('');
  const [hobbyDifficulty, setHobbyDifficulty] = useState('');
  const [hobbyCreationStatus, setHobbyCreationStatus] = useState('');
  const [isCreatingHobby, setIsCreatingHobby] = useState(false);

  const [isSchedulingModalVisible, setIsSchedulingModalVisible] = useState(false);
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [schedulingStatus, setSchedulingStatus] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(format(new Date(), 'yyyy-MM-dd'));


  const formatScheduledHobbiesForCalendar = (hobbiesList) => {
    const markedDates = {};
    if (Array.isArray(hobbiesList)) {
      hobbiesList.forEach(hobby => {
        const dateKey = format(parseISO(hobby.start_time), 'yyyy-MM-dd');
        if (!markedDates[dateKey]) {
          markedDates[dateKey] = { dots: [] };
        }
        markedDates[dateKey].dots.push({
          key: hobby.id,
          color: '#787D46',
          selectedDotColor: '#E4BA6A'
        });
      });
    }
    markedDates[selectedCalendarDate] = {
      ...markedDates[selectedCalendarDate],
      selected: true,
      selectedColor: '#BF9C59',
      selectedTextColor: '#FFFFFF'
    };
    return markedDates;
  };

  const handleCreateHobby = async () => {
    if (!hobbyName || !hobbyDescription) {
      setHobbyCreationStatus('Заполните название и описание');
      return;
    }

    if (!currentUser?.id) {
      setHobbyCreationStatus('Требуется авторизация для создания хобби');
      return;
    }

    setIsCreatingHobby(true);
    try {
      const response = await axios.post(`${API_URL}/hobbies/create/`, {
        name: hobbyName,
        description: hobbyDescription,
        category: hobbyCategory || null,
        difficulty: hobbyDifficulty ? parseInt(hobbyDifficulty) : null,
        user_id: currentUser.id
      });
      setHobbyCreationStatus('Хобби успешно создано!');
      setHobbyName('');
      setHobbyDescription('');
      setHobbyCategory('');
      setHobbyDifficulty('');
      fetchHobbies();
    } catch (error) {
      console.error("Error creating hobby:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.detail || 'Ошибка при создании хобби';
      setHobbyCreationStatus(errorMessage);
    } finally {
      setIsCreatingHobby(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const cachedUsers = await AsyncStorage.getItem(CACHE_KEY_USERS);
      const initialUsers = cachedUsers ? JSON.parse(cachedUsers).users || [] : [];
      setUsers(initialUsers);

      const response = await axios.get(`${API_URL}/users/`);
      const freshUsers = response.data.users || [];
      if (JSON.stringify(freshUsers) !== cachedUsers || cachedUsers === null) {
        setUsers(freshUsers);
        await AsyncStorage.setItem(CACHE_KEY_USERS, JSON.stringify({ users: freshUsers }));
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchHobbies = async () => {
    setLoadingHobbies(true);
    try {
      const cachedHobbies = await AsyncStorage.getItem(CACHE_KEY_HOBBIES);
      const initialHobbies = cachedHobbies ? JSON.parse(cachedHobbies) || [] : [];
      setHobbies(initialHobbies);

      // Фетчим хобби только если пользователь авторизован
      if (currentUser?.id) {
          const response = await axios.get(`${API_URL}/hobbies/`);
          const freshHobbies = response.data || [];
          if (JSON.stringify(freshHobbies) !== cachedHobbies || cachedHobbies === null) {
            setHobbies(freshHobbies);
            await AsyncStorage.setItem(CACHE_KEY_HOBBIES, JSON.stringify({ hobbies: freshHobbies }));
          }
      } else {
          // Если пользователь не авторизован, используем только кэш или пустой список
          setHobbies(initialHobbies);
      }
    } catch (err) {
      console.error('Error fetching hobbies:', err);
      setHobbies([]);
    } finally {
      setLoadingHobbies(false);
    }
  };

  const fetchScheduledHobbies = async (userId) => {
    if (!userId) {
      setScheduledHobbies({});
      setScheduledHobbiesList([]);
      setLoadingScheduledHobbies(false);
      return;
    }

    setLoadingScheduledHobbies(true);
    try {
      const cachedScheduledHobbies = await AsyncStorage.getItem(`${CACHE_KEY_SCHEDULED_HOBBIES}_${userId}`);
      if (cachedScheduledHobbies !== null) {
        const parsedCache = JSON.parse(cachedScheduledHobbies);
        setScheduledHobbiesList(parsedCache.scheduledHobbies || []);
        setScheduledHobbies(formatScheduledHobbiesForCalendar(parsedCache.scheduledHobbies || []));
      } else {
        setScheduledHobbiesList([]);
        setScheduledHobbies({});
      }

      const response = await axios.get(`${API_URL}/users/${userId}/scheduled-hobbies/`);
      const freshScheduledHobbies = response.data || [];

      if (JSON.stringify(freshScheduledHobbies) !== cachedScheduledHobbies || cachedScheduledHobbies === null) {
        setScheduledHobbiesList(freshScheduledHobbies);
        setScheduledHobbies(formatScheduledHobbiesForCalendar(freshScheduledHobbies));
        await AsyncStorage.setItem(`${CACHE_KEY_SCHEDULED_HOBBIES}_${userId}`, JSON.stringify({ scheduledHobbies: freshScheduledHobbies }));
      }
    } catch (err) {
      console.error('Error fetching scheduled hobbies:', err);
      setScheduledHobbiesList([]);
      setScheduledHobbies({});
    } finally {
      setLoadingScheduledHobbies(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // Загрузка хобби теперь зависит от currentUser
    // fetchHobbies();

    const checkCachedUser = async () => {
      try {
        const cachedUser = await AsyncStorage.getItem('@current_user');
        if (cachedUser !== null) {
          const userData = JSON.parse(cachedUser);
          setCurrentUser({
            ...userData,
            created_at: new Date(userData.created_at).toLocaleDateString()
          });
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.error('Error reading user data:', e);
      }
    };

    checkCachedUser();
  }, []);

  useEffect(() => {
    // Загружаем хобби и расписание при изменении currentUser
    fetchHobbies();
    fetchScheduledHobbies(currentUser?.id || null);
  }, [currentUser]);

   useEffect(() => {
    if (isSchedulingModalVisible && schedulingForHobby) {
      try {
        const dateStringFromCalendar = format(parseISO(selectedCalendarDate), 'dd.MM.yyyy');
        setDateInput(dateStringFromCalendar);
        setTimeInput('');
        setSchedulingStatus('');
      } catch (error) {
        console.error('Error setting initial date input:', error);
        setDateInput('');
        setTimeInput('');
         setSchedulingStatus('');
      }
    } else {
       setDateInput('');
       setTimeInput('');
       setSchedulingStatus('');
    }
  }, [isSchedulingModalVisible, schedulingForHobby, selectedCalendarDate]);

  const handleLogin = async () => {
    if (!loginUsername || !loginPassword) {
      setLoginStatus('Введите имя пользователя и пароль');
      return;
    }

    try {
      setLoginStatus('Вход...');
      const loginResponse = await axios.post(`${API_URL}/login/`, {
        username: loginUsername,
        password: loginPassword
      });
      const profileResponse = await axios.get(`${API_URL}/users/${loginResponse.data.id}`);

      setLoginStatus('Успешный вход!');
      setIsLoggedIn(true);
      const userDataToCache = {
        id: profileResponse.data.id,
        username: profileResponse.data.username,
        email: profileResponse.data.email,
        created_at: profileResponse.data.created_at
      };
      setCurrentUser({
        ...userDataToCache,
        created_at: new Date(userDataToCache.created_at).toLocaleDateString()
      });
      await AsyncStorage.setItem('@current_user', JSON.stringify(userDataToCache));

      setLoginUsername('');
      setLoginPassword('');

    } catch (error) {
      console.error("Error during login:", error.response?.data || error.message);
      const message = error.response?.data?.detail || 'Ошибка сервера';
      setLoginStatus(`Ошибка: ${message}`);
    }
  };

  const handleLogout = async () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setLoginStatus('');
    setScheduledHobbies({});
    setScheduledHobbiesList([]);
    setSchedulingForHobby(null);
    setHobbies([]); // Очищаем хобби при выходе

    try {
      await AsyncStorage.removeItem('@current_user');
      if (currentUser?.id) {
        await AsyncStorage.removeItem(`${CACHE_KEY_SCHEDULED_HOBBIES}_${currentUser.id}`);
        await AsyncStorage.removeItem(CACHE_KEY_HOBBIES); // Очищаем кэш хобби при выходе
      }
    } catch (e) {
      console.error('Error removing data:', e);
    }
  };

  const handleRegister = async () => {
    if (!regUsername || !regEmail || !regPassword) {
      setRegistrationStatus('Все поля обязательны');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(regEmail)) {
      setRegistrationStatus('НекорректиВ email');
      return;
    }

    try {
      setRegistrationStatus('Отправка данных...');
      await axios.post(`${API_URL}/register/`, {
        username: regUsername,
        email: regEmail,
        password: regPassword
      });
      setRegistrationStatus('Регистрация успешна! Можете войти.');
      setRegUsername('');
      setRegEmail('');
      setRegPassword('');
      fetchUsers();
    } catch (error) {
      console.error("Error during registration:", error.response?.data || error.message);
      const message = error.response?.data?.detail || 'Ошибка сервера';
      setRegistrationStatus(`Ошибка: ${message}`);
    }
  };

  const handleScheduleHobby = async () => {
      if (!currentUser?.id || !schedulingForHobby) {
          setSchedulingStatus('Ошибка: Пользователь не авторизован или хобби не выбрано.');
          return;
      }

      const dateParseResult = parse(dateInput, 'dd.MM.yyyy', new Date());
      const timeParseResult = parse(timeInput, 'HH:mm', new Date());

      if (!isValid(dateParseResult) || format(dateParseResult, 'dd.MM.yyyy') !== dateInput) {
          setSchedulingStatus('Ошибка: Неверный формат или значение даты (ДД.ММ.ГГГГ)');
          return;
      }
      if (!isValid(timeParseResult) || format(timeParseResult, 'HH:mm') !== timeInput) {
           setSchedulingStatus('Ошибка: Неверный формат или значение времени (ЧЧ:ММ)');
           return;
      }

      const scheduledDateTimeLocal = setMilliseconds(setSeconds(setMinutes(setHours(
          dateParseResult,
          timeParseResult.getHours()
      ), timeParseResult.getMinutes()), 0), 0);


      if (!isAfter(scheduledDateTimeLocal, new Date())) {
          setSchedulingStatus('Ошибка: Нельзя запланировать событие в прошлом.');
          return;
      }


      setIsScheduling(true);
      setSchedulingStatus('');

      try {
          const startTimeStringForBackend = format(scheduledDateTimeLocal, "yyyy-MM-dd HH:mm:ss");

          const response = await axios.post(`${API_URL}/schedule-hobby/`, {
              user_id: currentUser.id,
              hobby_id: schedulingForHobby.id,
              start_time: startTimeStringForBackend,
          });

          setSchedulingStatus('Хобби успешно запланировано!');
          fetchScheduledHobbies(currentUser.id);

          setSchedulingForHobby(null);
          setIsSchedulingModalVisible(false);
          setDateInput('');
          setTimeInput('');


      } catch (error) {
          console.error('Error scheduling hobby:', error);
          if (axios.isAxiosError(error) && error.response) {
              setSchedulingStatus(`Ошибка планирования: ${error.response.data.detail || error.message}`);
          } else {
              setSchedulingStatus(`Ошибка планирования: ${error.message}`);
          }
      } finally {
          setIsScheduling(false);
      }
  };


  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        swipeAnim.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx } = gestureState;
        const sensitivity = 50;

        const currentTabIndex = tabs.findIndex(t => t.id === activeTab);
        let newTabIndex =
          currentTabIndex;

        if (dx > sensitivity && currentTabIndex > 0) {
          newTabIndex = currentTabIndex - 1;
        } else if (dx < -sensitivity && currentTabIndex < tabs.length - 1) {
          newTabIndex = currentTabIndex + 1;
        }

        if (newTabIndex !== currentTabIndex) {
          const newTabId = tabs[newTabIndex].id;
          const direction = newTabId > activeTab ? 'left' : 'right';

          Animated.parallel([
            Animated.spring(swipeAnim, {
              toValue: 0,
              useNativeDriver: true
            }),
            Animated.timing(fadeOutAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(slideOutAnim, {
              toValue: direction === 'right' ?
                100 : -100,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setActiveTab(newTabId);
            fadeOutAnim.setValue(1);
            slideOutAnim.setValue(0);
            swipeAnim.setValue(0);
          });
        } else {
          Animated.spring(swipeAnim, {
            toValue: 0,
            useNativeDriver: true
          }).start();
        }
      }
    })
  ).current;

  const scaleAnimations = useRef(
    tabs.map(() => new Animated.Value(1))
  ).current;

  const handleTabPress = (tabId) => {
    if (tabId === activeTab) {
      Animated.spring(swipeAnim, {
        toValue: 0,
        useNativeDriver: true
      }).start();
      return;
    }

    const prevIndex = tabs.findIndex(t => t.id === activeTab);
    const newIndex = tabs.findIndex(t => t.id === tabId);
    const newDirection = tabId > activeTab ? 'left' : 'right';
    Animated.parallel([
      Animated.spring(scaleAnimations[prevIndex], {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnimations[newIndex], {
        toValue: 1.3,
        useNativeDriver: true,
      }),
      Animated.timing(fadeOutAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,

      }),
      Animated.timing(slideOutAnim, {
        toValue: newDirection === 'right' ? 100 : -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveTab(tabId);
      fadeOutAnim.setValue(1);
      slideOutAnim.setValue(0);
      swipeAnim.setValue(0);
    });
  };

  const commonContentStyle = {
    opacity: fadeOutAnim,
    transform: [{ translateX: slideOutAnim }],
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  };

  const renderContent = (tabId) => {
    switch (tabId) {
      case 1:
        return (
          <Animated.View style={[styles.content, commonContentStyle]}>
            <Text style={styles.formTitle}>Профили пользователей</Text>
            {loadingUsers ? (
              <Text style={styles.statusText}>Загрузка...</Text>
            ) : (
              <ScrollView style={{ width: '100%' }}>
                {Array.isArray(users) && users.length > 0 ? (
                  users.map((user) => (
                    <View key={user.id} style={styles.profileContainer}>
                      <Text style={styles.tabText}>{user.username}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noDataText}>Пользователи не найдены</Text>
                )}
              </ScrollView>
            )}
          </Animated.View>
        );
      case 2:
        return (
          <Animated.View style={[styles.content, commonContentStyle]}>
            {isLoggedIn ? (
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
                  style={[styles.registerButton, (!loginUsername || !loginPassword) && styles.disabledButton]}
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
                  style={[styles.registerButton, (!regUsername || !regEmail || !regPassword) && styles.disabledButton]}
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
                  <Text style={[styles.statusText, registrationStatus.includes('Ошибка') && styles.errorText, registrationStatus.includes('успешна') && styles.successText]}>
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
            <Text style={styles.formTitle}>Доступные хобби</Text>
            {!isLoggedIn ? (
                <Text style={styles.statusText}>Войдите или зарегистрируйтесь, чтобы увидеть доступные хобби.</Text>
            ) : (
              loadingHobbies ? (
                <Text style={styles.statusText}>Загрузка...</Text>
              ) : Array.isArray(hobbies) && hobbies.length > 0 ? (
                <ScrollView style={{ width: '100%' }}>
                  {hobbies.map((hobby) => (
                    <View key={hobby.id} style={styles.hobbyContainer}>
                      <Text style={styles.hobbyName}>{hobby.name}</Text>
                      <Text style={styles.hobbyDescription}>{hobby.description}</Text>
                      {hobby.category && <Text style={styles.hobbyDetail}>Категория: {hobby.category}</Text>}
                      {hobby.difficulty !== null && hobby.difficulty !== undefined && <Text style={styles.hobbyDetail}>Сложность: {hobby.difficulty}/5</Text>}
                      {isLoggedIn && (
                        <TouchableOpacity
                          style={styles.scheduleHobbyFromListButton}
                          onPress={() => {
                             setSchedulingForHobby(hobby);
                             setActiveTab(5);
                             setIsSchedulingModalVisible(true);
                          }}
                        >
                          <Text style={styles.buttonText}>Запланировать</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.noDataText}>Нет доступных хобби.</Text>
              )
            )}
          </Animated.View>
        );
      case 4:
        return (
          <Animated.View style={[styles.content, commonContentStyle]}>
            <Text style={styles.formTitle}>Добавить хобби</Text>
            {!isLoggedIn && (
              <Text style={styles.statusText}>Для создания хобби необходимо авторизоваться.</Text>
            )}
            <TextInput
              style={styles.input}
              placeholder="Название хобби*"
              value={hobbyName}
              onChangeText={setHobbyName}
              editable={isLoggedIn}
            />
            <TextInput
              style={styles.input}
              placeholder="Категория (необязательно)"
              value={hobbyCategory}
              onChangeText={setHobbyCategory}
              editable={isLoggedIn}
            />
            <TextInput
              style={styles.input}
              placeholder="Сложность (1-5)"
              keyboardType="numeric"
              value={hobbyDifficulty}
              onChangeText={text => {
                const numericValue = text.replace(/[^0-9]/g, '');
                if (numericValue === '' || (parseInt(numericValue) >= 1 && parseInt(numericValue) <= 5)) {
                  setHobbyDifficulty(numericValue);
                } else if (parseInt(numericValue) > 5) {
                   setHobbyDifficulty('5');
                }
              }}
              editable={isLoggedIn}
              maxLength={1}
            />
            <TextInput
              style={[styles.input, { height: 100 }]}
              placeholder="Описание хобби*"
              multiline
              value={hobbyDescription}
              onChangeText={setHobbyDescription}
              editable={isLoggedIn}
            />
            <TouchableOpacity
              style={[styles.registerButton, (!isLoggedIn || !hobbyName || !hobbyDescription || isCreatingHobby) && styles.disabledButton]}
              onPress={handleCreateHobby}
              disabled={isCreatingHobby || !isLoggedIn || !hobbyName || !hobbyDescription}>
              <Text style={styles.buttonText}>
                {isCreatingHobby ? 'Создание...' : 'Добавить хобби'}
              </Text>
            </TouchableOpacity>
            {hobbyCreationStatus && (
              <Text style={[
                styles.statusText,
                hobbyCreationStatus.includes('Ошибка') && styles.errorText,
                hobbyCreationStatus.includes('успешно') && styles.successText
              ]}>
                {hobbyCreationStatus}
              </Text>
            )}
          </Animated.View>
        );
      case 5:
        return (
          <Animated.View style={[styles.content, commonContentStyle, { paddingHorizontal: 0 }]}>
            <ScrollView style={{ width: '100%' }}>
              <Text style={[styles.formTitle, { marginBottom: 10 }]}>Ваш Календарь</Text>
              {!isLoggedIn && (
                <Text style={[styles.statusText, { marginBottom: 20 }]}>Войдите, чтобы увидеть календарь.</Text>
              )}
              {isLoggedIn && (
                <>
                  <Calendar
                    markingType={'dots'}
                    markedDates={scheduledHobbies}
                    onDayPress={(day) => {
                      setSelectedCalendarDate(day.dateString);
                    }}
                    theme={{
                      selectedDayBackgroundColor: '#BF9C59',
                      selectedDayTextColor: '#FFFFFF',
                      todayTextColor: '#AD6E6E',
                      arrowColor: '#7D4E25',
                      dotColor: '#787D46',
                      textSectionTitleColor: '#787D46',
                      textDisabledColor: '#d9e1e8',
                    }}
                    style={styles.calendar}
                    minDate={format(new Date(), 'yyyy-MM-dd')}
                  />
                  <View style={styles.eventsListContainer}>
                    <Text style={styles.eventsListTitle}>События на {format(parseISO(selectedCalendarDate), 'dd.MM.yyyy')}</Text>
                    {loadingScheduledHobbies ?
                      (
                        <Text style={styles.statusText}>Загрузка событий...</Text>
                      ) : (
                        <ScrollView style={{ width: '100%' }}>
                          {Array.isArray(scheduledHobbiesList) && scheduledHobbiesList
                            .filter(hobby => format(parseISO(hobby.start_time), 'yyyy-MM-dd') === selectedCalendarDate)
                            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                            .map((hobby) => (
                              <View key={hobby.id} style={styles.scheduledHobbyItem}>
                                <Text style={styles.scheduledHobbyName}>{hobby.hobby_name}</Text>
                                <Text style={styles.scheduledHobbyTime}>{format(parseISO(hobby.start_time), 'HH:mm')}</Text>
                              </View>
                            ))
                          }
                          {Array.isArray(scheduledHobbiesList) && scheduledHobbiesList.filter(hobby => format(parseISO(hobby.start_time), 'yyyy-MM-dd') === selectedCalendarDate).length === 0 && (
                            <Text style={{ textAlign: 'center', color: '#555' }}>На этот день нет запланированных хобби.</Text>
                          )}
                        </ScrollView>
                      )}
                  </View>
                   {!schedulingForHobby && (
                      <TouchableOpacity
                          style={styles.scheduleButton}
                          onPress={() => {
                               alert('Пожалуйста, выберите хобби из списка на вкладке "Хобби" для планирования.');
                          }}
                      >
                          <Text style={styles.buttonText}>Запланировать хобби</Text>
                      </TouchableOpacity>
                  )}
                </>
              )}
            </ScrollView>

            <Modal
                 visible={isLoggedIn && isSchedulingModalVisible && schedulingForHobby !== null}
                 animationType="slide"
                 transparent={true}
                 onRequestClose={() => {
                     setIsSchedulingModalVisible(false);
                     setSchedulingStatus('');
                     setSchedulingForHobby(null);
                     setDateInput('');
                     setTimeInput('');
                 }}
            >
                 <View style={styles.modalBackground}>
                     <View style={styles.modalContent}>
                       <Text style={styles.formTitle}>Запланировать хобби</Text>

                         <Text style={styles.label}>Выбранное хобbi:</Text>
                         <View style={styles.pickerPlaceholder}>
                            <Text style={{ color: '#000', fontSize: 16, fontWeight: 'bold' }}>{schedulingForHobby?.name || 'Хобbi не выбрано'}</Text>
                         </View>

                         <Text style={styles.label}>Дата (ДД.ММ.ГГГГ):</Text>
                         <TextInput
                            style={styles.input}
                            placeholder="Например, 22.05.2025"
                            value={dateInput}
                            onChangeText={setDateInput}
                            keyboardType="number-pad"
                            maxLength={10}
                        />

                         <Text style={styles.label}>Время (ЧЧ:ММ):</Text>
                         <TextInput
                            style={styles.input}
                            placeholder="Например, 14:30"
                            value={timeInput}
                            onChangeText={setTimeInput}
                            keyboardType="number-pad"
                            maxLength={5}
                        />

                       <TouchableOpacity
                           style={[styles.registerButton, (!schedulingForHobby || isScheduling || !dateInput || !timeInput) && styles.disabledButton]}
                           onPress={handleScheduleHobby}
                           disabled={!schedulingForHobby || isScheduling || !dateInput || !timeInput}
                       >
                           <Text style={styles.buttonText}>
                               {isScheduling ? 'Планирование...' : 'Запланировать'}
                           </Text>
                       </TouchableOpacity>

                         {schedulingStatus && (
                             <Text style={[
                                styles.statusText,
                                schedulingStatus.includes('Ошибка') && styles.errorText,
                                schedulingStatus.includes('успешно') && styles.successText
                             ]}>
                             {schedulingStatus}
                           </Text>
                         )}

                       <TouchableOpacity
                           style={styles.cancelButton}
                           onPress={() => {
                               setIsSchedulingModalVisible(false);
                               setSchedulingStatus('');
                               setSchedulingForHobby(null);
                               setDateInput('');
                               setTimeInput('');
                           }}
                       >
                           <Text style={styles.cancelButtonText}>Отмена</Text>
                       </TouchableOpacity>

                     </View>
                 </View>
            </Modal>

          </Animated.View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}></View>
      <Animated.View
        style={[
          styles.contentWrapper,
          { transform: [{ translateX: swipeAnim }] }
        ]}
        {...panResponder.panHandlers}
      >
        <View style={{flex: 1, width: '100%', alignItems: 'center'}}>
          {renderContent(activeTab)}
        </View>
      </Animated.View>
      <View style={styles.tabBar}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => handleTabPress(tab.id)}
          >
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ scale: scaleAnimations[index] }],
                  shadowOpacity: activeTab === tab.id ? 0.3 : 0,
                  backgroundColor: activeTab === tab.id ? '#E4BA6A' : '#BF9C59',
                }
              ]}
            >
              <Image
                source={activeTab === tab.id ?
                  tab.iconActive : tab.iconInactive}
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
    textAlign: 'center',
    width: '100%',
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
    color: '#000',
  },
  registerButton: {
    backgroundColor:
      '#787D46',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  disabledButton: {
      backgroundColor: '#A9A9A9',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusText: {
    color: '#787D46',
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    width: '100%',
  },
  errorText: {
    color: '#FF4444',
  },
   successText: {
      color: '#4CAF50',
  },
  switchFormButton: {
    marginTop: 15,
  },
  switchFormText: {
    color: '#7D4E25',
    textDecorationLine: 'underline',
  },
  topBar: {
    flex: 0,
    alignItems:
      'center',
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
    alignSelf: 'center',
  },
   contentWrapper: {
     flex: 1,
     width: '100%',
   },
  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
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
   hobbyContainer: {
      width: '100%',
      backgroundColor: "#BF9C59",
      padding: 15,
      marginVertical: 8,
      borderRadius: 10,
  },
   hobbyName: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 5,
      color: '#7D4E25',
  },
   hobbyDescription:
    {
      fontSize: 14,
      color: '#000000',
      marginBottom: 5,
  },
   hobbyDetail: {
      fontSize: 12,
      color: '#555',
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
    backgroundColor: '#787D46',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    position: 'relative',
    overflow: 'visible',
    justifyContent: 'flex-end',
    paddingBottom: 5,
  },
  iconContainer: {
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
  profileContent: {
    width: '100%',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 22,
    color: '#7D4E25',
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  userInfo: {
    backgroundColor: '#BF9C59',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    marginBottom: 20,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#AD6E6E',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '60%',
    alignItems: 'center',
  },

  calendar: {
    borderWidth: 1,
    borderColor: '#BF9C59',
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
  },
  eventsListContainer: {
      width: '100%',
      marginBottom: 20,
      backgroundColor: '#BF9C59',
      borderRadius: 10,
      padding: 15,
  },
   eventsListTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
      color: '#7D4E25',
      textAlign: 'center',
   },
   scheduledHobbyItem: {
      backgroundColor: '#F1EBD8',
      padding: 10,
      borderRadius: 8,
      marginBottom: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
   },
   scheduledHobbyName: {
      fontSize: 16,
      fontWeight: '500',
      color: '#000',
      flexShrink: 1,
      marginRight: 10,
   },
   scheduledHobbyTime: {
      fontSize: 14,
      color: '#555',
   },
   scheduleButton: {
     backgroundColor: '#AD6E6E',
     paddingVertical: 12,
     paddingHorizontal: 30,
     borderRadius: 25,
     width: '80%',
     alignSelf: 'center',
     alignItems: 'center',
     marginTop: 10,
     marginBottom: 20,
   },

    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 20,
    },
    modalContent: {
        backgroundColor: '#F1EBD8',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
        maxHeight: '90%',
    },
    label: {
        fontSize:
          16,
        color: '#7D4E25',
        marginBottom: 5,
        marginTop: 10,
        alignSelf: 'flex-start',
    },
    pickerButton: {
        height: 50,
        borderColor: '#BF9C59',
        borderWidth: 2,
        marginBottom: 15,
        paddingHorizontal: 15,
        borderRadius: 25,
        width: '100%',
        backgroundColor: '#FFF',
        justifyContent: 'center',
    },
    pickerPlaceholder: {
        height: 50,
        borderColor: '#BF9C59',
        borderWidth: 2,
        marginBottom: 15,
        paddingHorizontal: 15,
        borderRadius: 25,
        width: '100%',
        backgroundColor: '#FFF',
        justifyContent: 'center',
    },
     cancelButton: {
        marginTop: 20,
        paddingVertical: 10,
     },
     cancelButtonText: {
        color: '#AD6E6E',
        fontSize: 16,
        textDecorationLine: 'underline',
     },
     scheduleHobbyFromListButton: {
      backgroundColor: '#AD6E6E',
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 20,
      marginTop: 10,
      alignSelf: 'flex-end',
   },
   noDataText: {
    textAlign: 'center',
    color: '#7D4E25',
    marginTop: 20,
  }
});

export default App;