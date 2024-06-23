import { Edge } from "./Edge";
import { Point } from "./Point";
import { Quad } from "./Quad";

class Path {
    edges: Edge[] = [];
    isClosed = false;

    static getPaths(edges: Edge[]): Path[] {
        let paths: Path[] = [];

        while (edges.length !== 0) {
            //find path that starts at the first edge
            let path = Path.getFirstPath(edges);

            //get array without the edges found inside the path
            edges = edges.filter(edge => !path.edges.includes(edge));

            //add path
            paths.push(path);
        }

        return paths;
    }

    static getFirstPath(edges: Edge[]): Path {
        let path = new Path();

        if (edges.length !== 0) {
            //get firstEdge and add to path
            let firstEdge = edges[0];
            path.edges.push(firstEdge);

            // set first edge as current edge
            let currentEdge = firstEdge;

            //get the connectionPoint which is connected to the next edge
            let connectionPoint = currentEdge.point1;

            //get nextEdge which is connected to the connectionPoint
            let nextEdge = edges.find(edge => edge.hasPoint(connectionPoint) && edge !== currentEdge);

            //search for nextEdge as long as an edge exists and is not the firstEdge (closed path was found)
            while (nextEdge !== undefined && nextEdge !== firstEdge) {
                //add edge to path
                path.edges.push(nextEdge);

                // the connectionPoint must be the start point of the next edge (two possibilities since the points are not sorted)
                if (connectionPoint === nextEdge.point0) {
                    connectionPoint = nextEdge.point1; // set the connectionPoint of the next edge correctly
                } else if (connectionPoint === nextEdge.point1) {
                    connectionPoint = nextEdge.point0; // set the connectionPoint of the next edge correctly
                }

                //set new value of currentEdge
                currentEdge = nextEdge;

                //get nextEdge which is connected to the connectionPoint
                nextEdge = edges.find(edge => edge.hasPoint(connectionPoint) && edge !== currentEdge);
            }

            //check if path is closed
            path.isClosed = nextEdge === firstEdge;
        }

        return path;
    }
}

export function convertToSVG(quads: Quad[]): string {
    // get all edges
    let allEdges: Edge[] = [];
    quads.forEach(quad => {
        allEdges.push(quad.edge0);
        allEdges.push(quad.edge1);
        allEdges.push(quad.edge2);
        allEdges.push(quad.edge3);
    });

    //remove duplicate edges (hence, only get boundary edges that occur only once in the list)
    let edges = allEdges.filter(referenceEdge => {
        //get all edges which are equal to the reference edge
        let equalEdges = allEdges.filter(edge => referenceEdge.equals(edge));

        //if only one equal edge was found (namely the reference edge itself) then a boundary edges was found
        return equalEdges.length == 1;
    });
    // let edges = getOnlySingletons<Edge>(allEdges);

    // get all paths
    let paths = Path.getPaths(edges);

    // get SVG string
    return getSVGString(paths);
}

function getSVGString(paths: Path[]): string {
    let content = '';

    //loop through all paths
    for (const path of paths) {
        //loop through edges of actual path
        let firstEdge = true;
        let startPoint: Point | undefined;  //start point of edge (must be marked undefined, because tsc complains otherwise. Although it will be initilized in the first if statement.)
        for (const edge of path.edges) {
            if (firstEdge) {
                startPoint = edge.point0;
            }

            //draw edge
            content += edge.getSVGString(startPoint === edge.point0, firstEdge);

            //set next start point
            startPoint = startPoint === edge.point0 ? edge.point1 : edge.point0;
            firstEdge = false;
        }

        //close path
        content += 'Z\n';
    }

    return content;
}

function getOnlySingletons<Type extends { equals(object: Type): boolean }>(allObjects: Type[]): Type[] {
    let singletons: Type[] = [];

    // loop through all objects
    for (const referenceObject of allObjects) {
        // only add objects which occur once (singletons)
        let occursOnce = true;
        for (const object of allObjects) {
            // do not compare identical objects
            if (referenceObject == object) {
                continue;
            }

            // if object is equal it occurs more than once
            if (referenceObject.equals(object)) {
                occursOnce = false;
                break;
            }
        }

        // add to list if it only occurs once
        if (occursOnce) {
            singletons.push(referenceObject);
        }
    }

    return singletons;
}
