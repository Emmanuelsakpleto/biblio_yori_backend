const axios = require('axios');

async function testNotifications() {
  const BASE_URL = 'http://localhost:3001/api';
  
  try {
    // 1. Connexion en tant qu'étudiant (remplacez par des credentials valides)
    console.log('🔐 Connexion en tant qu\'étudiant...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'student@yori.com',
      password: 'Password123!'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Connexion réussie, token obtenu');
    
    const headers = { Authorization: `Bearer ${token}` };
    
    // 2. Récupérer les notifications non lues
    console.log('\n📬 Récupération des notifications...');
    const notificationsResponse = await axios.get(`${BASE_URL}/notifications/me`, { headers });
    const notifications = notificationsResponse.data.data.notifications;
    console.log(`✅ ${notifications.length} notifications trouvées`);
    
    if (notifications.length > 0) {
      console.log('Première notification:', {
        id: notifications[0].id,
        type: notifications[0].type,
        is_read: notifications[0].is_read
      });
    }
    
    // 3. Test du marquage individuel (si il y a des notifications non lues)
    const unreadNotification = notifications.find(n => !n.is_read);
    if (unreadNotification) {
      console.log('\n✏️ Test marquage individuel...');
      await axios.patch(`${BASE_URL}/notifications/${unreadNotification.id}/read`, {}, { headers });
      console.log('✅ Notification marquée comme lue individuellement');
    }
    
    // 4. Test du marquage global
    console.log('\n✏️ Test marquage global...');
    const markAllResponse = await axios.patch(`${BASE_URL}/notifications/me/mark-all-read`, {}, { headers });
    console.log('✅ Toutes les notifications marquées comme lues');
    console.log('Résultat:', markAllResponse.data);
    
    // 5. Vérification finale
    console.log('\n🔍 Vérification finale...');
    const finalCheck = await axios.get(`${BASE_URL}/notifications/me`, { headers });
    const finalNotifications = finalCheck.data.data.notifications;
    const unreadCount = finalNotifications.filter(n => !n.is_read).length;
    console.log(`✅ Notifications non lues restantes: ${unreadCount}`);
    
  } catch (error) {
    console.error('❌ Erreur:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
  }
}

// Exécuter le test
testNotifications();
