#!/usr/bin/env node

/**
 * Script de test pour valider les améliorations du dashboard reviews
 * Teste les API reviews avec différents utilisateurs
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

async function testReviewsForStudent(token) {
  console.log(`\n=== Test Reviews pour ÉTUDIANT ===`);

  try {
    // Test 1: Récupérer mes avis
    console.log('1. Test récupération de mes avis...');
    const myReviewsResponse = await fetch(`${BASE_URL}/reviews/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (myReviewsResponse.ok) {
      const myReviewsData = await myReviewsResponse.json();
      console.log('✅ Récupération mes avis OK');
      console.log(`   Mes avis trouvés: ${Array.isArray(myReviewsData.data) ? myReviewsData.data.length : 0}`);
    } else {
      console.log('❌ Erreur récupération mes avis:', myReviewsResponse.status);
    }

    // Test 2: Récupérer tous les avis (ne devrait retourner que les miens pour un étudiant)
    console.log('2. Test récupération tous les avis (filtré pour étudiant)...');
    const allReviewsResponse = await fetch(`${BASE_URL}/reviews`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (allReviewsResponse.ok) {
      const allReviewsData = await allReviewsResponse.json();
      console.log('✅ Récupération tous avis OK');
      console.log(`   Avis accessibles: ${Array.isArray(allReviewsData.data) ? allReviewsData.data.length : 0}`);
    } else {
      console.log('❌ Erreur récupération tous avis:', allReviewsResponse.status);
    }

  } catch (error) {
    console.error(`❌ Erreur test reviews étudiant:`, error.message);
  }
}

async function testReviewsForAdmin(token) {
  console.log(`\n=== Test Reviews pour ADMIN ===`);

  try {
    // Test 1: Récupérer tous les avis (admin a accès à tout)
    console.log('1. Test récupération tous les avis (admin)...');
    const allReviewsResponse = await fetch(`${BASE_URL}/reviews`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (allReviewsResponse.ok) {
      const allReviewsData = await allReviewsResponse.json();
      console.log('✅ Récupération tous avis OK');
      console.log(`   Total avis système: ${Array.isArray(allReviewsData.data) ? allReviewsData.data.length : 0}`);
      
      // Statistiques pour admin
      if (Array.isArray(allReviewsData.data)) {
        const reviews = allReviewsData.data;
        const approved = reviews.filter(r => r.is_approved).length;
        const pending = reviews.length - approved;
        const avgRating = reviews.length > 0 
          ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
          : 0;
        
        console.log(`   📊 Statistiques:`);
        console.log(`     - Approuvés: ${approved}`);
        console.log(`     - En attente: ${pending}`);
        console.log(`     - Note moyenne: ${avgRating}/5`);
      }
    } else {
      console.log('❌ Erreur récupération tous avis:', allReviewsResponse.status);
    }

    // Test 2: Test modération d'un avis (si disponible)
    if (allReviewsResponse.ok) {
      const allReviewsData = await allReviewsResponse.json();
      if (Array.isArray(allReviewsData.data) && allReviewsData.data.length > 0) {
        const firstReview = allReviewsData.data[0];
        console.log(`2. Test modération avis #${firstReview.id}...`);
        
        // Tenter de changer le statut
        const newAction = firstReview.is_approved ? 'reject' : 'approve';
        const moderateResponse = await fetch(`${BASE_URL}/reviews/${firstReview.id}/moderate`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: newAction })
        });

        if (moderateResponse.ok) {
          console.log(`✅ Modération OK (${newAction})`);
        } else {
          console.log('❌ Erreur modération:', moderateResponse.status);
        }
      } else {
        console.log('2. Aucun avis disponible pour test de modération');
      }
    }

  } catch (error) {
    console.error(`❌ Erreur test reviews admin:`, error.message);
  }
}

async function testReviewsFiltering(token) {
  console.log(`\n=== Test Filtrage des avis ===`);

  try {
    // Test avec différents filtres
    const filters = [
      { name: 'Note 5 étoiles', params: 'rating=5' },
      { name: 'Note 1 étoile', params: 'rating=1' },
      { name: 'Tri par date DESC', params: 'sort_by=created_at&sort_order=DESC' },
      { name: 'Tri par note ASC', params: 'sort_by=rating&sort_order=ASC' }
    ];

    for (const filter of filters) {
      console.log(`Test filtre: ${filter.name}...`);
      const response = await fetch(`${BASE_URL}/reviews?${filter.params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`  ✅ ${filter.name}: ${Array.isArray(data.data) ? data.data.length : 0} résultats`);
      } else {
        console.log(`  ❌ Erreur ${filter.name}:`, response.status);
      }
    }

  } catch (error) {
    console.error(`❌ Erreur test filtrage:`, error.message);
  }
}

async function main() {
  console.log('🧪 Test des améliorations Dashboard Reviews\n');

  // Test avec étudiant
  console.log('📚 Test avec utilisateur ÉTUDIANT...');
  const studentToken = await login(STUDENT_CREDENTIALS);
  if (studentToken) {
    await testReviewsForStudent(studentToken);
  } else {
    console.log('❌ Impossible de se connecter en tant qu\'étudiant');
  }

  // Test avec admin
  console.log('\n👑 Test avec utilisateur ADMIN...');
  const adminToken = await login(ADMIN_CREDENTIALS);
  if (adminToken) {
    await testReviewsForAdmin(adminToken);
    await testReviewsFiltering(adminToken);
  } else {
    console.log('❌ Impossible de se connecter en tant qu\'admin');
  }

  console.log('\n✨ Tests Dashboard Reviews terminés');
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
