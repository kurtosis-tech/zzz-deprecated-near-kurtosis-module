#!/usr/bin/env bash

set -euo pipefail   # Bash "strict mode"
script_dirpath="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"


# ==================================================================================================
#                                             Constants
# ==================================================================================================
VALIDATOR_KEY_PROPERTY_W_QUOTES='"rootValidatorKey":'
NETWORK_ID_PROPERTY="networkName"
MASTER_ACCOUNT_PROPERTY="account_id"
NODE_RPC_URL_PROPERTY="nearNodeRpcUrl"
HELPER_URL_PROPERTY="contractHelperServiceUrl"
EXPLORER_URL_PROPERTY="explorerUrl"
WALLET_URL_PROPERTY="walletUrl"
ALIAS_NAME="local_near"
NEAR_KURTOSIS_DIRPATH="${HOME}/.neartosis"
NEAR_MODULE_IMAGE="kurtosistech/near-kurtosis-module"
MODULE_EXEC_PARAMS='{"isWalletEnabled":true}'
KURTOSIS_CMD="kurtosis"

# Magic variables that the NEAR CLI will use if set (see https://github.com/near/near-cli/pull/885/files )
NEAR_CLI_NEAR_ENV_ENVVAR="NEAR_ENV"
NEAR_CLI_NETWORK_ID_ENVVAR="NEAR_CLI_LOCALNET_NETWORK_ID"
NEAR_CLI_NODE_URL_ENVVAR="NEAR_NODE_URL"
NEAR_CLI_KEY_FILEPATH_ENVVAR="NEAR_CLI_LOCALNET_KEY_PATH"
NEAR_CLI_WALLET_URL_ENVVAR="NEAR_WALLET_URL"
NEAR_CLI_CONTRACT_HELPER_URL_ENVVAR="NEAR_HELPER_URL"
NEAR_CLI_CONTRACT_HELPER_ACCOUNT_ENVVAR="NEAR_HELPER_ACCOUNT"
NEAR_CLI_EXPLORER_URL_ENVVAR="NEAR_EXPLORER_URL"

# Tells the CLI that it should use the 'localnet' config from its config.json
LOCALNET_NEAR_ENV="localnet"

# ==================================================================================================
#                                             Main Logic
# ==================================================================================================
if ! [ -d "${NEAR_KURTOSIS_DIRPATH}" ]; then
    if ! mkdir -p "${NEAR_KURTOSIS_DIRPATH}"; then
        echo "Error: No NEAR-in-Kurtosis directory was found at '${NEAR_KURTOSIS_DIRPATH}' so we tried to create it, but an error occurred" >&2
        exit 1
    fi
    echo "Created directory '${NEAR_KURTOSIS_DIRPATH}' for storing all NEAR-in-Kurtosis output"
fi

if ! now_str="$(date +%FT%H.%M.%S)"; then
    echo "Error: Couldn't retrieve the current timestamp, which is necessary for timestamping log & key files" >&2
    exit 1
fi

module_exec_dirpath="${NEAR_KURTOSIS_DIRPATH}/${now_str}"
if ! mkdir -p "${module_exec_dirpath}"; then
    echo "Error: Couldn't create directory '${module_exec_dirpath}' to store the module exec output" >&2
    exit 1
fi

exec_output_filepath="${module_exec_dirpath}/exec-output.log"
if ! "${KURTOSIS_CMD}" module exec "${NEAR_MODULE_IMAGE}" --execute-params "${MODULE_EXEC_PARAMS}" | tee "${exec_output_filepath}"; then
    echo "Error: An error occurred executing module '${NEAR_MODULE_IMAGE}' with execute params '${MODULE_EXEC_PARAMS}'" >&2
    exit 1
fi

function get_json_property() {
    module_output_filepath="${1:-}"
    property_name="${2:-}"
    if [ -z "${module_output_filepath}" ]; then
        echo "Error: The filepath to the module output must be provided" >&2
        return 1
    fi
    if [ -z "${property_name}" ]; then
        echo "Error: A JSON property name must be provided" >&2
        return 1
    fi
    cat "${module_output_filepath}" | grep "${property_name}" | awk '{print $NF}' | sed 's/^"//' | sed 's/",*$//'
}

validator_key_filepath="${module_exec_dirpath}/validator-key.json"
if ! cat "${exec_output_filepath}" | awk "/${VALIDATOR_KEY_PROPERTY_W_QUOTES}/,/\}/" | sed "s/${VALIDATOR_KEY_PROPERTY_W_QUOTES}//" | sed 's/},/}/' > "${validator_key_filepath}"; then
    echo "Error: Couldn't extract the validator key JSON from module exec logfile '${exec_output_filepath}'" >&2
    exit 1
fi
if ! contract_helper_url="$(get_json_property "${exec_output_filepath}" "${HELPER_URL_PROPERTY}")"; then
    echo "Error: Couldn't extract the contract helper URL from module exec logfile '${exec_output_filepath}'" >&2
    exit 1
fi
if ! network_id="$(get_json_property "${exec_output_filepath}" "${NETWORK_ID_PROPERTY}")"; then
    echo "Error: Couldn't extract the network ID from module exec logfile '${exec_output_filepath}'" >&2
    exit 1
fi
if ! master_account="$(get_json_property "${exec_output_filepath}" "${MASTER_ACCOUNT_PROPERTY}")"; then
    echo "Error: Couldn't extract the master account from module exec logfile '${exec_output_filepath}'" >&2
    exit 1
fi
if ! node_url="$(get_json_property "${exec_output_filepath}" "${NODE_RPC_URL_PROPERTY}")"; then
    echo "Error: Couldn't extract the NEAR node RPC URL from module exec logfile '${exec_output_filepath}'" >&2
    exit 1
fi
if ! helper_url="$(get_json_property "${exec_output_filepath}" "${HELPER_URL_PROPERTY}")"; then
    echo "Error: Couldn't extract the contract helper service URL from module exec logfile '${exec_output_filepath}'" >&2
    exit 1
fi
if ! explorer_url="$(get_json_property "${exec_output_filepath}" "${EXPLORER_URL_PROPERTY}")"; then
    echo "Error: Couldn't extract the explorer URL from module exec logfile '${exec_output_filepath}'" >&2
    exit 1
fi
if ! wallet_url="$(get_json_property "${exec_output_filepath}" "${WALLET_URL_PROPERTY}")"; then
    echo "Error: Couldn't extract the wallet URL from module exec logfile '${exec_output_filepath}'" >&2
    exit 1
fi

alias_command="alias ${ALIAS_NAME}='near --nodeUrl ${node_url} --walletUrl ${wallet_url} --helperUrl ${helper_url} --keyPath ${validator_key_filepath} --networkId ${network_id} --masterAccount ${master_account}'"

echo "============================================================ SUCCESS ================================================================================"
echo "  ACTION Paste the following in your terminal to declare the following variables so you can use them:"
echo ""
echo "           export ${NEAR_CLI_NEAR_ENV_ENVVAR}=\"${LOCALNET_NEAR_ENV}\""
echo "           export ${NEAR_CLI_NETWORK_ID_ENVVAR}=\"${network_id}\""
echo "           export ${NEAR_CLI_NODE_URL_ENVVAR}=\"${node_url}\""
echo "           export ${NEAR_CLI_KEY_FILEPATH_ENVVAR}=\"${validator_key_filepath}\""
echo "           export ${NEAR_CLI_WALLET_URL_ENVVAR}=\"${wallet_url}\""
echo "           export ${NEAR_CLI_CONTRACT_HELPER_URL_ENVVAR}=\"${contract_helper_url}\""
echo "           export ${NEAR_CLI_CONTRACT_HELPER_ACCOUNT_ENVVAR}=\"${master_account}\""
echo "           export ${NEAR_CLI_EXPLORER_URL_ENVVAR}=\"${explorer_url}\""
echo "  "
echo "  ACTION Paste the following into your terminal now to use the '${ALIAS_NAME}' command as a replacement for the NEAR CLI for connecting to your"
echo "         local cluster (e.g. '${ALIAS_NAME} login'):"
echo "  "
echo "         alias ${ALIAS_NAME}='${NEAR_CLI_NEAR_ENV_ENVVAR}=\"${LOCALNET_NEAR_ENV}\" ${NEAR_CLI_NETWORK_ID_ENVVAR}=\"${network_id}\" ${NEAR_CLI_NODE_URL_ENVVAR}=\"${node_url}\" ${NEAR_CLI_KEY_FILEPATH_ENVVAR}=\"${validator_key_filepath}\" ${NEAR_CLI_WALLET_URL_ENVVAR}=\"${wallet_url}\" ${NEAR_CLI_CONTRACT_HELPER_URL_ENVVAR}=\"${contract_helper_url}\" ${NEAR_CLI_CONTRACT_HELPER_ACCOUNT_ENVVAR}=\"${master_account}\" ${NEAR_CLI_EXPLORER_URL_ENVVAR}=\"${explorer_url}\" near --masterAccount ${master_account}'"
echo "  "
echo "  ACTION If you want the '${ALIAS_NAME}' command available in all your new terminal windows, add the above alias into your .bash_profile/.bashrc/.zshrc"
echo "         file and open a new terminal window."
echo "  "
echo "  ACTION To stop your cluster:"
echo "          1. Run '${KURTOSIS_CMD} enclave ls'"
echo "          2. Copy the enclave ID that your NEAR cluster is running inside"
echo "          3. Run '${KURTOSIS_CMD} enclave stop ENCLAVE_ID_YOU_COPIED'"
echo "  "
echo "  ACTION To remove stopped clusters, run '${KURTOSIS_CMD} clean'. You can also run '${KURTOSIS_CMD} clean -a' to stop & remove *all* clusters,"
echo "         including running ones."
echo "============================================================ SUCCESS ================================================================================"
