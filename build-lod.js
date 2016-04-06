
var fs = require('fs');
var parseObj = require('parse-obj');
var async = require('async');
var inputDir = "/Users/alan/dev/obj-split/testdata/quarry_3M_obj/0/";
var LodVertex3 = require('./LodVertex3');

var obj_files = [];

blast_off(inputDir);

function blast_off(inputDir)
{
    loadAllObjs(inputDir, doHierarchy);

}


function doHierarchy()
{
    //Order smallest (low-res) to largest (original)
    obj_files.sort(_hierarchy_sort);

    // Extract the global vertex list
    var GlobalVertices = getVertices();
    //console.log(vertices);

    // Build discrete-progressive hierarchy
    //
    // 1. Write from smallest to largest LOD level
    // 2. Begin writing first level's vertices (marking in array they've been written)
    // 3. Then its faces
    // 4. Then write next level's vertices (that haven't already been written)
    // 5. Then its faces
    // 6. etc

    var LodVertices = [];       // array of arrays
    var LodFaceIndices = [];    //


    for (var t=0; t<obj_files.length; t++)
    {
        var thisMesh = obj_files[t];
        var thisMeshVertexList = [];
        var faceList = [];

        // proceed through Frame's face list and add each vertex it uses

        for (var f=0; f<thisMesh.facePositions.length; f++)
        {
            var face = thisMesh.facePositions[f];

            for (var fv=0; fv<face.length; fv++)
            {
                var vert = GlobalVertices[face[fv]];
                if (vert.written == false)
                {
                    thisMeshVertexList.push(vert);
                    vert.written = true; // only write this mother ONCE
                }
            }
        }

        LodVertices.push(thisMeshVertexList);
    }

    var hierarchy = {
        totalFaces: GlobalVertices.length,
        frames:[]
    };

    for (var t=0; t<LodVertices.length; t++)
    {
        var vertexList = LodVertices[t];

        hierarchy.frames[t] = {
            vertices: vertexList,
            faces: obj_files[t].facePositions
        };
    }

    fs.writeFile(inputDir+"lod.json", JSON.stringify(hierarchy), function(){
        console.log("Done");
        process.exit(0);
    });
}

function getVertices()
{
    var vertices = [];
    var original_mesh = obj_files[obj_files.length-1];

    for (var t= 0, l=original_mesh.vertexPositions.length; t<l; t++)
    {
        var v = original_mesh.vertexPositions[t];
        vertices.push(new LodVertex3(v[0], v[1], v[2], t));
    }

    return vertices;
}


function loadAllObjs(inputDir, callbackWhenDone)
{
    var files = fs.readdirSync(inputDir);

    async.forEachSeries(files,
        function(file, cb)
        {
            process.stdout.write("Reading `"+file+"`...");
            parseObj(fs.createReadStream(inputDir + file), function (err, result) {
                //cb(result);
                obj_files.push(result);
                console.log("OK");
                cb();
            });

        }, function(err)
        {
            if (callbackWhenDone) callbackWhenDone();
        }

    );
}

function _hierarchy_sort(a, b)
{
    return a.facePositions.length - b.facePositions.length;
}