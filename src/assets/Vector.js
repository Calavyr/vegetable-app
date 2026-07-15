export class Vector {
    constructor(x, y) {
        this.x = x
        this.y = y
    }

    add(otherVector) {
        return new Vector(this.x + otherVector.x, this.y + otherVector.y)
    }

    sub(otherVector) {
        return new Vector(this.x - otherVector.x, this.y - otherVector.y)
    }

    mul(otherVector) {
        return new Vector(this.x * otherVector.x, this.y * otherVector.y)
    }

    mulScalar(scalar) {
        return new Vector(this.x * scalar, this.y * scalar)
    }

    div(otherVector) {
        return new Vector(this.x * otherVector.x, this.y * otherVector.y)
    }

    magnitudeSquared() {
        return this.x * this.x + this.y * this.y
    }

    magnitude() {
        return Math.sqrt(this.magnitudeSquared)
    }

    dot(otherVector) {
        return (this.x * otherVector.x) + (this.y * otherVector.y)
    }
}