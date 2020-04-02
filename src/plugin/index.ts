

import addMutationPlugin from "./addMutationPlugin";
import bulkAddMutationPlugin from "./bulkAddMutationPlugin";
import bulkUpdateMutationPlugin from "./bulkUpdateMutationPlugin";
import genCacheMethodsPlugin from "./genCacheMethodsPlugin";
import deleteMutationPlugin from "./deleteMutationPlugin";
import genHasManyLinkPlugin from "./genHasManyLinkPlugin";
import genHasOneLinkPlugin from "./genHasOneLinkPlugin";
import pluralQueryPlugin from "./pluralQueryPlugin";
import saveMutationPlugin from "./saveMutationPlugin";
import singularQueryPlugin from "./singularQueryPlugin";
import timestampPlugin from "./timestampPlugin";
import updateMutationPlugin from "./updateMutationPlugin";
import versionPlugin from "./versionPlugin";

export default [addMutationPlugin, bulkAddMutationPlugin, bulkUpdateMutationPlugin, genCacheMethodsPlugin, deleteMutationPlugin, genHasManyLinkPlugin, genHasOneLinkPlugin, pluralQueryPlugin, saveMutationPlugin, singularQueryPlugin, timestampPlugin, updateMutationPlugin, versionPlugin];