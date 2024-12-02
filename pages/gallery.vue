<template>
  <div class="gallery">
    <h1>Galerie</h1>
    <button @click="logout">Déconnexion</button>

<upload />

    <div v-if="photos.length">
      <div v-for="photo in photos" :key="photo.id" class="photo">
        <img :src="`/uploads/${photo.filename}`" :alt="photo.filename" />
        <p>{{ photo.filename }}</p>
        <button @click="deletePhoto(photo.id)">Supprimer</button>
      </div>
    </div>
    <p v-else>Aucune photo disponible.</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const photos = ref([]);
const router = useRouter();

watch(
  () => photos.value,
  (newVal) => {
    console.log('newVal:', newVal);
  }
);

const fetchPhotos = async () => {
  const token = localStorage.getItem('token');
  try {
    photos.value = await $fetch('/gallery', {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    router.push('/login');
  }
};

const deletePhoto = async (id: number) => {
  const token = localStorage.getItem('token');
  await $fetch(`/api/photos/${id}`, {
    method: 'DELETE',
    body: { key: token },
  });
  await fetchPhotos();
};

const logout = () => {
  localStorage.removeItem('token');
  router.push('/login');
};

onMounted(() => {
  fetchPhotos();
});
</script>

<style scoped>
.gallery {
  padding: 1rem;
}
.photo {
  margin: 1rem 0;
  display: flex;
  align-items: center;
}
.photo img {
  max-width: 100px;
  margin-right: 1rem;
}
</style>
