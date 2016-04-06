

// converts an Wavefront .OBJ file into a binary format

var parseObj = require('parse-obj');
var fs = require('fs');

var SIZEOF_INT32 = 4; //bytes
var SIZEOF_DOUBLE = 8;
var SIZEOF_FLOAT = 4;
var SIZEOF_BYTE = 1;


var FLOAT_MODE_32 = true; // otherwise uses 64-bit doubles

var path = "./newdata/quarry/4";
var file = "quarry_newest_131015_simplified_3d_mesh.obj";

var fullpath = path+"/" + file;

console.log("Processing '"+fullpath+"'...");

readObj(fullpath, function(mesh){

    // convert json mesh to binary here

    //console.log(mesh);
    obj2bin(mesh, function(geom_binary, tex_binary){

        var binPath = path+"/"+file;

        var g_binPath = binPath;
        var t_binPath = binPath;

        if (FLOAT_MODE_32) {
            g_binPath += ".f32.bin";
            t_binPath += ".f32.tex.bin";
        } else {
            g_binPath += ".f64.bin";
            t_binPath += ".f64.tex.bin";
        }

        var kb_g = Math.trunc(geom_binary.length / 1024);
        var kb_t = Math.trunc(tex_binary.length / 1024);

        fs.writeFileSync(g_binPath, geom_binary);
        fs.writeFileSync(t_binPath, tex_binary);

        console.log("Wrote "+kb_g+" KB to '"+g_binPath+"'");
        console.log("Wrote "+kb_t+" KB to '"+t_binPath+"'");

    });

});

function readObj(file, cb)
{

    /**
     *
     vertexPositions an array of vertex position data
     vertexNormals an array of vertex normal data
     vertexUVs an array of vertex UV coordinates
     facePositions an array of indices for face positions
     faceNormals an array of indices for face normals
     faceUVs an array of indices for face texture coordinates
     *
     */

    parseObj(fs.createReadStream(file), function (err, result) {
        cb(result);
    });

}


function obj2bin(mesh, cb)
{
    var vertexPositions = mesh.vertexPositions;
    var vertexUVs = mesh.vertexUVs;

    var facePositions = mesh.facePositions;
    var uvPositions = mesh.faceUVs;


    var lv = vertexPositions.length;
    var lvu = vertexUVs.length;

    var lf = facePositions.length;
    var lfuv = uvPositions.length;


    var vBufferSize = lv * 3 * SIZEOF_DOUBLE;     // vertex XYZ
    var uvBufferSize = lvu * 2 * SIZEOF_DOUBLE;    // vertex UV

    // Float32 probably be the standard, can't yet see the need for 64bit doubles
    if (FLOAT_MODE_32) {
        vBufferSize = lv * 3 * SIZEOF_FLOAT;      // XYZ
        uvBufferSize = lvu * 2 * SIZEOF_FLOAT;    // UV
    }

    var fBufferSize   = lf * 3 * SIZEOF_INT32;      // Faces
    var fuvBufferSize = lfuv * 3 * SIZEOF_INT32;    // Face UVs

    var geom_headerBuffer =  new Buffer(2 * SIZEOF_INT32);
    var geom_vertexBuffer = new Buffer(vBufferSize);
    var geom_faceBuffer = new Buffer(fBufferSize);

    var tex_headerBuffer = new Buffer(2 * SIZEOF_INT32);
    var tex_vertexBuffer = new Buffer(uvBufferSize);
    var tex_faceBuffer   = new Buffer(fuvBufferSize);

    var o = 0;
    // Write geometry header
    geom_headerBuffer.writeUInt32LE(lv, o); o += SIZEOF_INT32;
    geom_headerBuffer.writeUInt32LE(lf, o); o += SIZEOF_INT32;

    o = 0;
    // Write texture (UV) header
    tex_headerBuffer.writeUInt32LE(lvu, o); o += SIZEOF_INT32;
    tex_headerBuffer.writeUInt32LE(lfuv,o); o += SIZEOF_INT32;

    o = 0;

    /** Write geometry data **/

    for (var t = 0; t < lv; t++)
    {
        var v = vertexPositions[t];

        if (FLOAT_MODE_32)
        {
            geom_vertexBuffer.writeFloatLE(v[0], o);o += SIZEOF_FLOAT; //x
            geom_vertexBuffer.writeFloatLE(v[1], o);o += SIZEOF_FLOAT; //y
            geom_vertexBuffer.writeFloatLE(v[2], o);o += SIZEOF_FLOAT; //z
        } else {

            geom_vertexBuffer.writeDoubleLE(v[0],o); o += SIZEOF_DOUBLE; //x
            geom_vertexBuffer.writeDoubleLE(v[1],o); o += SIZEOF_DOUBLE; //y
            geom_vertexBuffer.writeDoubleLE(v[2],o); o += SIZEOF_DOUBLE; //z
        }
    }
    o = 0;
    for (var t=0; t < lf; t++)
    {
        var f = facePositions[t];
        geom_faceBuffer.writeUInt32LE(f[0], o); o += SIZEOF_INT32;
        geom_faceBuffer.writeUInt32LE(f[1], o); o += SIZEOF_INT32;
        geom_faceBuffer.writeUInt32LE(f[2], o); o += SIZEOF_INT32;
    }

    o = 0;

    /** Write texture UV data **/

    for (var t=0; t < lvu; t++)
    {
        var v = vertexUVs[t];
        tex_vertexBuffer.writeFloatLE(v[0], o); o += SIZEOF_FLOAT;
        tex_vertexBuffer.writeFloatLE(v[1], o); o += SIZEOF_FLOAT;
    }

    o = 0;

    for (var t=0; t<lfuv; t++)
    {
        var f = uvPositions[t];
        tex_faceBuffer.writeUInt32LE(f[0], o); o += SIZEOF_INT32;
        tex_faceBuffer.writeUInt32LE(f[1], o); o += SIZEOF_INT32;
        tex_faceBuffer.writeUInt32LE(f[2], o); o += SIZEOF_INT32;
    }

    var geom_data = Buffer.concat([geom_headerBuffer, geom_vertexBuffer, geom_faceBuffer]);
    var tex_data = Buffer.concat([tex_headerBuffer, tex_vertexBuffer, tex_faceBuffer]);

    cb(geom_data, tex_data);


}

