| ID | Name | Parameters |
|----|------|------------|
| 1001 | queryPlayerAccountUid | uid |
| 1002 | queryPlayerUidByAccountUid | account_type, account_uid |
| 1004 | queryPlayerBinInfo | uid |
| 1005 | sendMail | uid, title, content, sender, expire_time, importance, config_id, item_limit_type, tag, source_type, item_list (separated by ,) |
| 1006 | queryRedisMailInfo | uid |
| 1007 | queryPlayerPostion | uid |
| 1009 | queryCombatForce | uid |
| 1011 | queryRegions | |
| 1012 | queryPlayerWorldBinInfo | uid |
| 1013 | queryPlayerBlockBinInfo | uid |
| 1014 | queryPlayerGroupBinInfo | uid, group_id |
| 1015 | queryPlayerQuestBinInfo | uid |
| 1016 | queryPlayerItemBinInfo | uid |
| 1017 | queryPlayerGroupBinInfo2 | uid, group_id, block_id |
| 1018 | queryPlayerCoopBinInfo | uid |
| 1101 | getPlayerNum | |
| 1102 | queryLoginBlackUid | uid |
| 1103 | updateLoginBlackUid | uid, begin_time, end_time |
| 1104 | delLoginBlackUid | uid |
| 1105 | addWhiteAccountUid | account_type, account_uid |
| 1106 | isWhiteAccountUid | account_type, account_uid |
| 1107 | queryPlayerStatusRedisData | uid |
| 1108 | queryPlayerOnline | uid, gameserver_id |
| 1109 | delPlayerStatusRedisData | uid, last_login_rand |
| 1110 | guestBindAccount | account_id, uid, account_type |
| 1111 | delItem | uid, item_id, item_num |
| 1112 | playerGoto | uid, scene_id, x, y, z |
| 1113 | resetParentQuest | uid, parent_quest_id |
| 1114 | refreshGroupSuite | uid, group_id, suite_id |
| 1115 | setScenePointLockStatus | |
| 1116 | gmTalk | uid, msg |
| 1117 | setNickName | uid, nickname |
| 1118 | refreshShop | uid |
| 1119 | unlockTalent | uid, avatar_id, skill_depot_id, talent_id |
| 1120 | takeoffEquip | uid, avatar_id, equip_id |
| 1121 | delMail | uid, mail_id |
| 1122 | finishDailyTask | uid, daily_task_id |
| 1123 | queryRedisOfflineMsg | uid |
| 1124 | unlockArea | uid, area_id |
| 1125 | delItemNegative | uid, item_id, item_num |
| 1126 | delEquip | uid, guid |
| 1127 | addItem | uid, item_id, item_count, [extra_params (oneof WeaponBin or ReliquaryBin)] |
| 1128 | modifyBornPos | uid, scene_id, pos |
| 1129 | getPlatformPlayerNum | |
| 1134 | delRedisMail | uid, mail_index, mail_ticket |
| 1135 | subCoinNegative | uid, scoin, hcoin, mcoin, is_psn |
| 1136 | bindGmUid | gm_uid, player_uid |
| 1137 | unBindGmUid | gm_uid |
| 1138 | getBindGmUid | app_id |
| 1139 | setQuestContentProgress | uid, quest_id, finish_progress, fail_progress |
| 1140 | queryOrderDataByUid | uid, begin_trade_time, end_trade_time |
| 1141 | queryOrderDataByTradeNo | trade_no |
| 1143 | finishOrder | order_id |
| 1144 | delRedisMailByTicket | uid, mail_ticket |
| 1145 | insertMailBlockTag | |
| 1146 | batchBlockPlayerChat | block_list |
| 1147 | batchUnblockPlayerChat | unblock_uid_list (separated by ,) |
| 1148 | queryPlayerChatBlockStatus | uid |
| 1149 | addOrModifyWatcher | uid, watcher_id, progress |
| 1150 | delWatcher | uid, watcher_id |
| 1151 | queryPlayerFriendList | uid |
| 1152 | checkVersions | server_version, client_version, client_silence_version |
| 1153 | queryPlayerBriefData | uid |
| 1154 | queryPlayerExtraBinData | uid |
| 1155 | updatePlayerSecurityLevel | uid, check_type, security_level |
| 1156 | QueryPlayerRegPlatform | uid |
| 1157 | addFeatureSwitch | id, type, msg |
| 1158 | deleteFeatureSwitch | id |
| 1159 | setSignature | uid, signature |
| 1160 | addOrSubResin | uid, delta_count, is_sub |
| 1161 | setQuestGlobalVarValue | uid, global_var_id, value |
| 1162 | changeBindAccount | account_id, uid, account_type |
| 1163 | SetUserTag | tag, uids (separated by ,) |
| 1164 | batchBlockPlayerMp | block_uid_list |
| 1165 | batchUnblockPlayerMp | unblock_uid_list (separated by ,) |
| 1166 | queryPlayerMpBlockStatus | uid |
| 1167 | queryCrcSuspiciousList | uid |
| 1168 | addToCrcSuspiciousList | uid_list, is_notify |
| 1169 | removeFromCrcSuspiciousList | uid_list |
| 1170 | checkCrcVersions | platform_type, client_version |
| 1171 | forceAcceptQuest | uid, quest_id |
| 1172 | setMainCoopConfidence | uid, confidence |
| 1173 | addCoopPointSavePointList | uid, coop_point_id, save_point_list, ticket |
| 1174 | setFinishParentQuestChildQuestState | uid, quest_id, state |
| 1175 | setLevel1AreaExplorePoint | uid, scene_id, level1_area_id, explore_point |
| 1176 | setCodexOpenOrClose | uid, codex_type, codex_id, is_open |
| 1200 | addMcoinVipPoint | uid, mcoin, vip_point, is_psn |
| 1201 | getPlayerLoginPerSecond | |
| 1210 | getFineGrainedPlayerNum | |
| 1211 | removeGadgetInGroupByConfigId | uid, scene_id, group_id, config_id |
| 1212 | operateDelGadgetInGroupByConfigId | uid, scene_id, group_id, config_id, is_add |
| 1213 | operateGadgetStateInGroupByConfigId | uid, scene_id, group_id, config_id, state, is_create |
| 1214 | removeMonsterInGroupByConfigId | uid, scene_id, group_id, config_id |
| 1215 | operateDelMonsterInGroupByConfigId | uid, scene_id, group_id, config_id, is_add |
| 1216 | removeGroupTriggerByName | uid, scene_id, group_id, trigger_name |
| 1217 | setGroupTriggerCountByName | uid, scene_id, group_id, trigger_name, trigger_count |
| 1218 | setGroupVariableByName | uid, scene_id, group_id, variable_name, value |
| 1219 | setGroupTargetSuite | uid, scene_id, group_id, target_suite |
| 1220 | removeGroupOneoffByConfigId | uid, scene_id, group_id, config_id, is_monster |
| 1221 | finishRoutine | uid, routine_id |
| 1222 | finishDailyTaskUnloadGroup | uid, daily_task_id |
| 1223 | refreshBlossomCircleCamp | uid, refresh_id, circle_camp_id |
| 1224 | queryPlayerShowAvatarInfo | uid, avatar_id |
| 1225 | kickOutPlayerByAccountUid | account_type, account_uid |
| 1226 | operateSetGroupDead | uid, scene_id, group_id |
| 1227 | operateSetGroupUnregister | uid, scene_id, group_id |
| 1228 | recoverWorldLevel | uid |
| 1229 | addRegionSearchProgress | uid, region_id, add_recycle, add_progress |
| 1230 | setMatchPunishTimes | uid, match_id, punish_times |
| 1231 | resetChannellerSlabCampGroup | uid, stage_id, round_id |
| 1232 | procSceneTag | uid, scene_id, scene_tag_id, op_type |
| 1233 | setClimateAreaType | uid, scene_id, climate_area_id, climate_type |
| 1234 | exchangeMcoin | uid, num, exchange_type |
| 1235 | sendConcertProduct | uid, config_id |
| 1236 | updateRedPoint | uid, red_point_list |
| 1237 | queryConcertProductInfo | uid, config_id |
| 1238 | kickOutPlayerByUid | uid, reason |
| 1301 | registerGroupLinkBundle | uid, group_bundle_id, activity_id |
| 1302 | finishGroupLinkBundle | uid, group_bundle_id |
| 1303 | unregisterGroupLinkBundle | uid, group_bundle_id |
| 1405 | AntiAddictNotify | msg_type, account_type, account_uid, msg, level |
| 5001 | queryPlayerMemBasicData | uid |
| 5002 | queryPlayerMemBasicDataByAccountUid | account_type, account_uid |
| 5003 | queryPlayerRedisBasicData | uid |
| 5004 | queryPlayerRedisBasicDataByAccountUid | account_type, account_uid |
| 5005 | queryPlayerH5ActivityData | uid, h5_schedule_id_list |
| 6000 | queryHomeBinInfo | uid |
| 6001 | batchBlockHome | block_list |
| 6002 | batchUnblockHome | unblock_uid_list (separated by ,) |
| 6004 | homeRestoreDefaultsArrangement | uid, module_id_list |
| 6005 | homeRestoreDefaultsSceneArrangement | uid, module_id, scene_id |
| 6006 | queryHomeBlockStatus | uid |