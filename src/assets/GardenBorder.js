import { Vector } from "./Vector"
import { Crop } from "./Crop"

export class GardenBorder {
    constructor(points) {
        this.points = points || []
    }

    isPointInPolygon(point) {
        let inside = false
        for (let i = 0; i < this.points.length; i++) {
            let currentPoint = this.points[i]
            let nextPoint = this.points[(i + 1) % this.points.length]

            if (currentPoint.y > point.y != nextPoint.y > point.y) {
                let gradientReciprocal = (nextPoint.x - currentPoint.x)/(nextPoint.y - currentPoint.y)
                let intersectX = currentPoint.x + (point.y - currentPoint.y) * gradientReciprocal
                if (point.x < intersectX) {
                    inside = !inside
                }
            }
        }
        return inside
    }

    isCropInPolygon(crop) {
        if (!this.isPointInPolygon(crop.pos)) {
            return false
        }
        let boundingPoints = crop.getBoundingPoints()
        for (let i = 0; i < boundingPoints.length; i++) {
            if (!this.isPointInPolygon(boundingPoints[i])) {
                return false;
            }
        }
        return true
    }

    getClosestPointOnEdge(point, edgePoint1, edgePoint2) {
        let edgeVector = edgePoint2.sub(edgePoint1)
        let edgeToPoint = point.sub(edgePoint1)

        let projectionScalar = (edgeToPoint.dot(edgeVector)) / (edgeVector.magnitudeSquared())

        if (projectionScalar <= 0) {
            return edgePoint1
        } else if (projectionScalar >= 1) {
            return edgePoint2
        } else {
            return edgePoint1.add(edgeVector.mulScalar(projectionScalar))
        }
    }

    isPointOnEdge(point) {
        let maxDistSquared = 4 ** 2
        for (let i = 0; i < this.points.length; i++) {
            let edgePoint1 = this.points[i]
            let edgePoint2 = this.points[(i + 1) % this.points.length]

            let closestPointOnEdge = this.getClosestPointOnEdge(point, edgePoint1, edgePoint2)
            let squaredDist = closestPointOnEdge.sub(point).magnitudeSquared()

            if (squaredDist <= maxDistSquared) {
                return true
            }
        }
        return false
    }

    getPoints() { // Returns points in vue-konva-friendly 2n array [x1, y1, x2, y2...]
        let flattenedArray = []
        for (let point of this.points) {
            flattenedArray.push(point.x)
            flattenedArray.push(point.y)
        }
        return flattenedArray
    }
}