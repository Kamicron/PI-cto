<template>
  <div class="login">
    <h1>Connexion</h1>
    <form @submit.prevent="login">
      <input v-model="password" type="password" placeholder="Mot de passe" />
      <button type="submit">Se connecter</button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ref } from 'vue';

const router = useRouter();
const password = ref('');
const error = ref('');

const login = async () => {
  try {
    const response = await $fetch('http://localhost:3001/login', { // Appel direct au backend
      method: 'POST',
      body: { password: password.value },
    });

    console.log('Réponse du serveur :', response);

    if (response.token) {
      localStorage.setItem('token', response.token);
      router.push('/gallery');
    } else {
      throw new Error('Token manquant.');
    }
  } catch (err) {
    console.error('Erreur lors de la connexion :', err);
    error.value = 'Mot de passe incorrect ou problème serveur.';
  }
};
</script>

<style scoped>
.login {
  max-width: 400px;
  margin: auto;
  padding: 1rem;
  text-align: center;
}
.error {
  color: red;
  margin-top: 1rem;
}
</style>
