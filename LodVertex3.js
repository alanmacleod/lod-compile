/**
 * Created by alan on 06/04/2016.
 */

module.exports = LodVertex3;

function LodVertex3(x, y, z, id)
{
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.id = 0;
    this.written = false;
    if (x != null && y != null && z != null && id != null)
    {
        this.x = x; this.y = y; this.z = z; this.id = id;
    }
}