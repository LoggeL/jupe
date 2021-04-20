const fs = require('fs')
const CWebp = require('cwebp').CWebp;
const sharp = require('sharp')

const imagemin = require('imagemin');
const imageminJpegtran = require('imagemin-jpegtran');

const imageminJpegAutorotate = require('./imagemin-jpeg-autorotate');

let json = [];
const sizes = [['thumb', 20], ['small', 400], ['medium', 600], ['large', 800]];

(async () => {
    const year = "2020"

    const files = await imagemin([`../${year}/full/*.jpg`], {
        plugins: [
            imageminJpegAutorotate({
                disable: false
            }),
            imageminJpegtran(),
        ]
    })
    for (let l = 0; l < sizes.length; l++) {
        if (!fs.existsSync(`../${year}/${sizes[l][0]}`)) {
            fs.mkdirSync(`../${year}/${sizes[l][0]}`)
            console.log('Created', sizes[l][0])
        }
    }

    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const imgName = file.sourcePath.replace(`../${year}/full/`, '').replace('.jpg', '');
        const imgWidth = (await sharp(file.data).metadata()).width
        let img = { name: imgName, sizes: [] };
        for (let l = 0; l < sizes.length; l++) {
            let [sizeName, width] = sizes[l]

            if (imgWidth <= 400 && sizeName == 'medium') return
            if (imgWidth <= 600 && sizeName == 'large') return

            if (imgWidth < 200) return
            else if (imgWidth < 400 && sizeName == 'small') width = imgWidth
            else if (imgWidth < 600 && sizeName == 'medium' && imgWidth > 400) width = imgWidth
            else if (imgWidth < 800 && sizeName == 'large' && imgWidth > 600) width = imgWidth

            console.log(imgWidth, width)

            let data
            if (width === imgWidth) data = file.data
            data = await sharp(file.data)
                .resize({ width })
                .toBuffer()
            fs.writeFileSync(`../${year}/${sizeName}/${imgName}.jpg`, data)
            const encoder = new CWebp(data);
            const newMeta = await sharp(data).metadata()
            encoder.write(`../${year}/${sizeName}/${imgName}.webp`)
            img.sizes.push(sizeName)
        }
        json.push(img)
    }

    console.log('Saved')
    //fs.writeFileSync('../data/images.json', JSON.stringify(json))
})()