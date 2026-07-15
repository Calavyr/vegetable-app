import data from '@/data/plants.json'
import { useImage } from 'vue-konva'
import { Vector } from "./Vector"

export class Crop {
    constructor(id, point) {
        this.id = id
        let matchingData = data.find((obj) => obj.id === id)
        this.plant = matchingData.plant
        this.colour = matchingData.colour
        this.minArea = matchingData.minArea
        this.imageUrl = matchingData.image
        this.image = new Image()
        this.image.src = this.imageUrl
        this.image.width = this.minArea
        this.image.height = this.minArea
        this.pos = point
        this.imagePos = this.pos.sub(new Vector(this.image.width / 2, this.image.height / 2))
    }

    getBoundingPoints() {
        const topLeft = this.pos.sub(new Vector(this.image.width / 2, this.image.height / 2))
        const topRight = this.pos.sub(new Vector(-this.image.width / 2, this.image.height / 2))
        const bottomLeft = this.pos.sub(new Vector(this.image.width / 2, -this.image.height / 2))
        const bottomRight = this.pos.sub(new Vector(-this.image.width / 2, -this.image.height / 2))
        return [topLeft, topRight, bottomLeft, bottomRight]
    }
}