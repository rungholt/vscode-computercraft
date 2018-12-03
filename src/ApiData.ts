import * as fs from "fs"

const brackets = /\[.*\]/g

const additionalTriggers = {
    // trigger: "Key",
}

export default class L4RCApiData {

    private classes: L4RCTypeMap
    private defines: L4RCTypeMap

    constructor(private dataPath: string) {
        this.loadData(dataPath)
    }

    public findType(words: string[]): L4RCType {
        if (words.length === 0) {
            return { properties: this.classes }
        }

        // Clean up path by removing array/dict access brackets (players[0] => players)
        words = words.map(p => p.replace(brackets, ""))

        let type = this.classes[words.shift()]

        if (!type) {
            return null
        }

        if (!type.properties || words.length === 0) {
            return type
        }

        let props = type.properties

        for (let i = 0; i < words.length; i++) {
            type = props[words[i]]

            // Not found
            if (!type) return null

            // First try traverse it's own properties
            if (type.properties) {
                props = type.properties
                continue
            }

            // Then the complete type list
            let parentType = type.type

            // Special handling for defines
            if (/defines/.test(parentType)) {
                let [__, defineName] = parentType.split(".")
                //let define = this.defines[defineName]
                //return _.get(this.defines, [defineName, "properties"])
                if (defineName && this.defines[defineName])
                    return this.defines[defineName]
                else
                    return null
            }

            type = this.classes[parentType]

            if (type && type.properties) {
                props = type.properties
                continue
            }
        }

        return type
    }

    private loadData(dataPath: string) {
        const classes = this.loadDataFile(dataPath + "/classes.json")
        const defines = this.loadDataFile(dataPath + "/defines.json")

        // Add some additional autocomplete triggers (when typing on blank line or pressing ctrl-space)
        Object.keys(additionalTriggers).forEach(trigger => {
            let luaType = additionalTriggers[trigger]
            if (luaType in classes) {
                classes[trigger] = classes[luaType]
            }
        })

        this.classes = classes
        this.defines = defines
        // todo: revisit this
        this.classes.defines = {
            type: "define",
            properties: defines
        }
    }

    private loadDataFile(fileName: string): L4RCTypeMap {
        const jsonStr = fs.readFileSync(fileName, "utf8")
        const data = JSON.parse(jsonStr)
        return data
    }
}
