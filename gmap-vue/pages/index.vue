<template>
  <el-container style="height: auto; border: 1px solid #eee">
    <!-- Row et Col pour le responsive -->
    <el-row>
      <!-- Col fonctionne comme une media query -->
      <el-col
        :xs="24"
        :sm="24"
        :md="24"
        :lg="12"
        :xl="12"
        style="background-color: rgb(238, 241, 246)"
      >
        <div class="block" style="width:95%;margin:auto">
          <!-- Slider qui permet de filtrer la note des restaurants -->
          <!-- value est dans data, c'est un tableau qui contient la portée du slider par défaut 0 à 5 étoiles -->
          <el-slider v-model="value" range show-stops :max="5" />
        </div>
        <template>
          <!-- El-table est un tableau, il est filtré en fonction de la valeur de l'index 0 et 1 de value -->
          <!-- Il affiche mes restaurants -->
          <el-table
            :data="tableData.filter(resto => resto.average >= value[0] && resto.average <= value[1])"
            style="width: 100%"
            max-height="500"
            :row-key="row => tableData.indexOf(row)"
            :expand-row-keys="openedTable"
          >
            <el-table-column type="expand" fixed>
              <template slot-scope="props">
                <p class="tableauRestau">
                  <!-- Gmap street view panorama est un composant qui vient d'un plugin qui permet d'afficher un aperçu street view à partir de l'API google -->
                  <gmap-street-view-panorama
                    class="pano"
                    :position="{lat: props.row.lat, lng: props.row.lng}"
                    :pov="pov"
                    :zoom="1"
                  />
                </p>
                <p class="tableauRestau">
                  <b>Adresse:</b>
                  {{ props.row.address }}
                </p>
                <p class="tableauRestau">
                  <b>Comments:</b>
                </p>
                <!-- Notes de chaque éléments de mon tableau -->
                <p v-for="(item, index) in props.row.ratings" :key="index" class="tableauRestau">
                  {{ item.comment }}
                  <el-rate
                    v-model="item.stars"
                    :data="tableData"
                    disabled
                    show-score
                    text-color="#ff9900"
                    score-template="{value}"
                  />
                </p>
                <p>
                  <!-- Formulaire pour commenter et donner une note au restaurant -->
                  <el-form ref="formComment" :model="formComment" label-width="120px">
                    <el-form-item label="Note">
                      <el-rate
                        v-model="formComment.note"
                        :texts="['1', '2', '3', '4', '5']"
                        show-text
                      />
                    </el-form-item>
                    <el-form-item label="Commentaire">
                      <el-input v-model="formComment.comment" type="textarea" />
                    </el-form-item>
                    <el-form-item>
                      <el-button type="primary" @click="onSubmitAddComment(props.$index)">
                        Envoyer
                      </el-button>
                    </el-form-item>
                  </el-form>
                </p>
              </template>
            </el-table-column>
            <el-table-column label="Note moyenne" prop="ratings" sortable>
              <!-- Affiche la note moyenne de chaque restaurants -->
              <template slot-scope="props">
                <el-rate
                  v-model="props.row.average"
                  :data="tableData"
                  disabled
                  show-score
                  text-color="#ff9900"
                  score-template="{value}"
                />
              </template>
            </el-table-column>
            <el-table-column label="Nom du restaurant" prop="restaurantName" />
          </el-table>
          <!-- Form d'ajout de restaurants -->
          <el-form
            slotref="form"
            :model="addRestaurantForm"
            label-width="auto"
            style="margin-top:20px; margin-right:10px"
          >
            <el-form-item label="Nom" prop="name" style="margin-left:10px">
              <el-input v-model="addRestaurantForm.name" />
            </el-form-item>
            <el-form-item label="Adresse" prop="address" style="margin-left:10px">
              <el-input v-model="addRestaurantForm.address" />
            </el-form-item>
            <el-form-item label="Latitude" prop="lat" style="margin-left:10px">
              <el-input v-model="addRestaurantForm.lat" />
            </el-form-item>
            <el-form-item label="Longitude" prop="lng" style="margin-left:10px">
              <el-input v-model="addRestaurantForm.lng" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="onSubmitAddRestaurant()">
                Ajouter restaurant
              </el-button>
            </el-form-item>
          </el-form>
        </template>
      </el-col>
      <el-col
        style="height:100%"
        :xs="24"
        :sm="24"
        :md="24"
        :lg="12"
        :xl="12"
      >
        <!-- Gmap Map est un composant qui vient d'un plugin qui permet d'afficher une map google à partir de l'API google -->
        <GmapMap
          v-if="coord != undefined"
          ref="map"
          :center="coord"
          :zoom="15"
          map-type-id="terrain"
          style="width: 100%; height: 100%"
          :options="{
            zoomControl: false,
            mapTypeControl: true,
            scaleControl: false,
            streetViewControl: true,
            rotateControl: false,
            fullscreenControl: false,
            disableDefaultUi: false}"
          @dragend="$refs.map.$mapPromise.then(refreshPosition)"
          @click="getLatLng"
        >
          <!-- Gmap Marker est un composant qui vient d'un plugin qui permet d'afficher un marker sur la map gmap à partir de l'API google -->
          <!-- Ici je défini un marker pour chaque restaurant dans mon tableau -->
          <GmapMarker
            v-for="(m, index) in tableData"
            :key="index"
            :position="m"
            :clickable="true"
            :draggable="false"
            @click="openedTable = [index]"
          />
          <!-- Je défini un marker personnalisé à ma position actuelle -->
          <GmapMarker :position="coord" icon="https://i.stack.imgur.com/rU427.png" />
        </GmapMap>
      </el-col>
    </el-row>
  </el-container>
</template>

<script>
import { gmapApi } from 'vue2-google-maps'
export default {
  data() {
    return {
      openedTable: [],
      pov: null,
      pano: null,
      coord: undefined,
      value: [0, 5],
      addRestaurantForm: {
        restaurantName: '',
        address: '',
        lat: 0,
        lng: 0
      },
      formComment: {
        note: 0,
        comment: ''
      },
      // Tableau de mes restaurants
      tableData: [
        {
          restaurantName: 'Bronco',
          address: '39 Rue des Petites Écuries, 75010 Paris',
          lat: 48.8737815,
          lng: 2.3501649,
          ratings: [
            {
              stars: 4,
              comment:
                "Un excellent restaurant, j'y reviendrai ! Par contre il vaut mieux aimer la viande."
            },
            {
              stars: 5,
              comment: 'Tout simplement mon restaurant préféré !'
            }
          ]
        },
        {
          restaurantName: 'Babalou',
          address: '4 Rue Lamarck, 75018 Paris',
          lat: 48.8865035,
          lng: 2.3442197,
          ratings: [
            {
              stars: 5,
              comment:
                'Une minuscule pizzeria délicieuse cachée juste à côté du Sacré choeur !'
            },
            {
              stars: 3,
              comment: "J'ai trouvé ça correct, sans plus"
            }
          ]
        }
      ]
    }
  },
  computed: {
    google: gmapApi
  },
  // Fonction asynchrone qui se lance lors du montage du composant Vue.js qui attend d'avoir la géolocalisation de l'utilisateur pour continuer
  async mounted() {
    await this.getCoord()
    this.updateAverage()
    // Fonction asynchrone qui se lance lors du montage du composant Vue.js qui attend d'avoir affiché toutes les Google Places dans un rayon d'1 km autour la position actuelle de l'utilisateur
    await this.getPlaces()
  },
  methods: {
    // Fonction qui se lance après avoir bougé la carte, elle récupère la position du centre de la carte et définie cette position comme la position actuelle de l'utilisateur et met ensuite à jour les Google Places
    refreshPosition(map) {
      this.coord = { lat: map.getCenter().lat(), lng: map.getCenter().lng() }
      this.getPlaces()
    },
    // Géolocalisation
    async getCoord() {
      this.coord = await this.$getLocation({
        enableHighAccuracy: false, // defaults to false
        timeout: Infinity, // defaults to Infinity
        maximumAge: 0 // defaults to 0
      })
    },
    // Fonction asynchrone qui récupère les Google Places et leurs détails depuis Places.API de Google autour de ma position
    async getPlaces() {
      const map = await this.$refs.map.$mapPromise
      const service = new this.google.maps.places.PlacesService(map)
      const request = {
        location: new this.google.maps.LatLng(this.coord.lat, this.coord.lng),
        radius: '1000',
        type: ['restaurant']
      }
      const results = await new Promise(resolve =>
        service.nearbySearch(request, (results, status) =>
          status === this.google.maps.places.PlacesServiceStatus.OK
            ? resolve(results)
            : undefined
        )
      )
      results.forEach((result) => {
        const requestNote = {
          placeId: result.place_id
        }
        service.getDetails(requestNote, (place, status) => {
          if (status === this.google.maps.places.PlacesServiceStatus.OK) {
            const placesDetails = []
            if (place.reviews) {
              place.reviews.forEach(review =>
                placesDetails.push({
                  stars: parseFloat(review.rating),
                  comment: review.text
                })
              )
              if (
                !this.tableData.find(
                  restaurant => place.place_id === restaurant.placeID
                )
              ) {
                this.tableData.push({
                  restaurantName: result.name,
                  address: place.formatted_address,
                  lat: parseFloat(result.geometry.location.lat()),
                  lng: parseFloat(result.geometry.location.lng()),
                  placeID: result.place_id,
                  average: result.rating,
                  ratings: placesDetails
                })
              }
            }
          }
        })
      })
    },
    // Récupère la latitude et longitude de l'event "click" sur la Google Map
    getLatLng(event) {
      this.addRestaurantForm.lat = event.latLng.lat()
      this.addRestaurantForm.lng = event.latLng.lng()
    },
    // Ajoute le restaurant au tableau de données
    onSubmitAddRestaurant(index) {
      this.tableData.push({
        restaurantName: this.addRestaurantForm.name,
        address: this.addRestaurantForm.address,
        lat: parseFloat(this.addRestaurantForm.lat),
        lng: parseFloat(this.addRestaurantForm.lng),
        ratings: [],
        average: 0
      })
      this.addRestaurantForm = {}
    },
    // Ajoute le commentaire au tableau de données
    onSubmitAddComment(index) {
      this.tableData[index].ratings.push({
        stars: this.formComment.note,
        comment: this.formComment.comment
      })
      this.updateAverage()
      this.formComment = {}
    },
    // Met à jour la note moyenne d'un restaurant
    updateAverage: function () {
      this.tableData = this.tableData.map((value, index) => {
        let somme = 0
        value.ratings.forEach((valeur) => {
          somme += valeur.stars
        })
        value.average = somme / value.ratings.length
        value.average = parseFloat(value.average.toFixed(1))
        return value
      })
    }
  }
}
</script>

<style>
.el-header {
  background-color: #b3c0d1;
  color: #333;
  line-height: 60px;
}

.tableauRestau {
  margin-bottom: 20px;
}

.pano {
  width: 500px;
  height: 300px;
}

.el-row {
  width: 100%;
}
</style>
