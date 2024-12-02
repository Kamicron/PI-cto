<template>
  <div class="upload">
    <h1>Ajouter une photo</h1>
    <form @submit.prevent="uploadPhoto">
      <input type="file" @change="onFileChange" />
      <input v-model="folder" type="text" placeholder="Nom du dossier (facultatif)" />
      <button type="submit">Envoyer</button>
    </form>
    <p v-if="message" class="success">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const file = ref(null); // Stocke le fichier sélectionné
const folder = ref(''); // Nom du dossier (facultatif)
const message = ref('');
const error = ref('');

const apiKey = useRuntimeConfig().public.apiKey;

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  file.value = target.files?.[0] || null;
};

const uploadPhoto = async () => {
  if (!file.value) {
    error.value = 'Veuillez sélectionner une photo.';
    return;
  }

  const formData = new FormData();
  formData.append('photo', file.value);
  formData.append('folder', folder.value || '');
  formData.append('key', apiKey); // Ajoute la clé API

  try {
    const response = await fetch('http://localhost:3001/api/photos', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l’envoi');
    }

    const data = await response.json();
    message.value = data.message || 'Photo ajoutée avec succès.';
    error.value = '';
  } catch (err) {
    console.error('Erreur lors de l’upload :', err);
    error.value = 'Erreur lors de l’envoi.';
    message.value = '';
  }
};
</script>

<style scoped>
.upload {
  max-width: 400px;
  margin: auto;
  padding: 1rem;
  text-align: center;
}
.success {
  color: green;
}
.error {
  color: red;
}
</style>
