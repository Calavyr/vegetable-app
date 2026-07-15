<template>
    <div>
        <button @click="fetchForecast">Fetch weather</button>
        <p ref="display"></p>
    </div>
</template>

<script>

export default {
    data() {
        return {
            forecast: ''
        }
    },
    methods: {
        fetchForecast() {
            if (!navigator.geolocation) return false
            let successCallback = async (pos) => {
                let lat = pos.coords.latitude
                let long = pos.coords.longitude
                let url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&daily=temperature_2m_max,temperature_2m_min,wind_speed_10m_max&hourly=temperature_2m,relative_humidity_2m,precipitation_probability&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&timezone=auto`
                const response = await fetch(url)
                if (!response.ok) {
                    alert('Error fetching weather data from API')
                    return true
                }
                const result = await response.json()
                this.forecast = result
                this.displayForecast()
                console.log(result)
            }
            let errorCallback = (err) => {
                alert('Error fetching location')
                console.log(err)
                return true
            }
            navigator.geolocation.getCurrentPosition(successCallback, errorCallback)
        },
        displayForecast() {
            let curr = this.forecast.current
            let currentWeather = `Temp: ${curr.temperature_2m}C\nPrecipitation: ${curr.precipitation}mm\nWind Speed: ${curr.wind_speed_10m}km/h`
            this.$refs.display.innerText = currentWeather
        }
    }
}

</script>

<style scoped>
div {
    position: absolute;
    top: 10%;
    left: 20%;
    width: 60%;
    height: 80%;
    border: black 2px solid;
    background-color: white;
}
</style>