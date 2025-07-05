#!/usr/bin/env node

/**
 * Script de test pour vérifier la correction des notifications
 * Teste les API avec un utilisateur étudiant et admin
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api';

// Identifiants de test
const STUDENT_CREDENTIALS = {
  email: 'marie.dubois@univ.fr',
  password: 'password123'
};

const ADMIN_CREDENTIALS = {
  email: 'admin@lectura.fr', 
  password: 'admin123'
};

async function login(credentials) {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Login failed: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.data?.token || data.token;
  } catch (error) {
    console.error('Erreur de login:', error.message);
    return null;
  }
}

async function testNotifications(token, userType) {
  console.log(`\n=== Test notifications pour ${userType} ===`);

  try {
    // Test 1: Récupérer les notifications
    console.log('1. Test récupération des notifications...');
    const notifResponse = await fetch(`${BASE_URL}/notifications/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (notifResponse.ok) {
      const notifData = await notifResponse.json();
      console.log('✅ Récupération notifications OK');
      console.log(`   Notifications trouvées: ${notifData.data?.length || 0}`);
    } else {
      console.log('❌ Erreur récupération notifications:', notifResponse.status);
    }

    // Test 2: Marquer toutes comme lues
    console.log('2. Test marquage toutes notifications comme lues...');
    const markAllResponse = await fetch(`${BASE_URL}/notifications/me/mark-all-read`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (markAllResponse.ok) {
      const markAllData = await markAllResponse.json();
      console.log('✅ Marquage toutes notifications OK');
      console.log(`   Résultat:`, markAllData.message);
    } else {
      const error = await markAllResponse.text();
      console.log('❌ Erreur marquage toutes notifications:', markAllResponse.status);
      console.log('   Détails:', error);
    }

    // Test 3: Compter notifications non lues
    console.log('3. Test comptage notifications non lues...');
    const countResponse = await fetch(`${BASE_URL}/notifications/me/unread-count`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (countResponse.ok) {
      const countData = await countResponse.json();
      console.log('✅ Comptage notifications OK');
      console.log(`   Notifications non lues: ${countData.data?.count || 0}`);
    } else {
      console.log('❌ Erreur comptage notifications:', countResponse.status);
    }

  } catch (error) {
    console.error(`❌ Erreur test notifications ${userType}:`, error.message);
  }
}

async function testReviews(token, userType) {
  console.log(`\n=== Test avis pour ${userType} ===`);

  try {
    // Test récupération avis
    const endpoint = userType === 'ADMIN' ? '/reviews' : '/reviews/me';
    console.log(`1. Test récupération avis (${endpoint})...`);
    
    const reviewsResponse = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (reviewsResponse.ok) {
      const reviewsData = await reviewsResponse.json();
      console.log('✅ Récupération avis OK');
      console.log(`   Avis trouvés: ${reviewsData.data?.length || 0}`);
    } else {
      console.log('❌ Erreur récupération avis:', reviewsResponse.status);
    }

  } catch (error) {
    console.error(`❌ Erreur test avis ${userType}:`, error.message);
  }
}

async function main() {
  console.log('🧪 Test des corrections notifications et reviews\n');

  // Test avec étudiant
  console.log('📚 Test avec utilisateur ÉTUDIANT...');
  const studentToken = await login(STUDENT_CREDENTIALS);
  if (studentToken) {
    await testNotifications(studentToken, 'ÉTUDIANT');
    await testReviews(studentToken, 'ÉTUDIANT');
  } else {
    console.log('❌ Impossible de se connecter en tant qu\'étudiant');
  }

  // Test avec admin
  console.log('\n👑 Test avec utilisateur ADMIN...');
  const adminToken = await login(ADMIN_CREDENTIALS);
  if (adminToken) {
    await testNotifications(adminToken, 'ADMIN');
    await testReviews(adminToken, 'ADMIN');
  } else {
    console.log('❌ Impossible de se connecter en tant qu\'admin');
  }

  console.log('\n✨ Tests terminés');
}

// Vérifier que le serveur est démarré
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

checkServer().then(isRunning => {
  if (!isRunning) {
    console.error('❌ Le serveur backend ne semble pas être démarré sur http://localhost:5000');
    console.log('💡 Démarrez le serveur avec: npm start (dans le dossier Backend)');
    process.exit(1);
  } else {
    main();
  }
});
