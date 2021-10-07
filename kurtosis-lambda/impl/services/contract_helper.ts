import { NetworkContext, ServiceID, ContainerConfig, ContainerConfigBuilder, SharedPath, ServiceContext, PortBinding } from "kurtosis-core-api-lib";
import log = require("loglevel");
import { Result, ok, err } from "neverthrow";
import { DOCKER_PORT_PROTOCOL_SEPARATOR, EXEC_COMMAND_SUCCESS_EXIT_CODE, NearKey, TCP_PROTOCOL, tryToFormHostMachineUrl } from "../consts";
import { ContainerConfigSupplier } from "../near_lambda";

const SERVICE_ID: ServiceID = "contract-helper-service"
const PORT_NUM: number = 3000;
const DOCKER_PORT_DESC: string = PORT_NUM.toString() + DOCKER_PORT_PROTOCOL_SEPARATOR + TCP_PROTOCOL;
const IMAGE: string = "kurtosistech/near-contract-helper";
const ACCOUNT_CREATOR_KEY_ENVVAR: string = "ACCOUNT_CREATOR_KEY";
const INDEXER_DB_CONNECTION_ENVVAR: string = "INDEXER_DB_CONNECTION";
const NODE_RPC_URL_ENVVAR: string = "NODE_URL";
const STATIC_ENVVARS: Map<string, string> = new Map(Object.entries({
    "MAIL_HOST": "smtp.ethereal.email",
    "MAIL_PASSWORD": "",
    "MAIL_PORT": "587",
    "MAIL_USER": "",
    "NEW_ACCOUNT_AMOUNT": "10000000000000000000000000",
    "NODE_ENV": "development", // Node.js environment; either `development` or `production`
    "PORT": PORT_NUM.toString(), // Used internally by the contract helper; does not have to correspond to the external IP or DNS name and can link to a host machine running the Docker container
    "TWILIO_ACCOUNT_SID": "", // account SID from Twilio (used to send security code)
    "TWILIO_AUTH_TOKEN": "", // auth token from Twilio (used to send security code)
    "TWILIO_FROM_PHONE": "+14086179592", // phone number from which to send SMS with security code (international format, starting with `+`)
    // NOTE: We can't set this because there's a circular dependency between Wallet and Contract Helper app, where
    //  they both need to point to each others' _publicly-facing ports_ (which are only available after starting the container)
    // Following the lead of https://github.com/near/local/blob/master/docker-compose.yml, we're choosing to break Contract Helper app
    "WALLET_URL": "" // NOTE: we can't set this because there's a circular dependency between 
}));

export class ContractHelperServiceInfo {
    private readonly networkInternalHostname: string;
    private readonly networkInternalPorNum: number;
    // Will only be set if debug mode is enabled
    private readonly maybeHostMachineUrl: string | undefined;

    constructor(
        networkInternalHostname: string,
        networkInternalPorNum: number,
        maybeHostMachineUrl: string | undefined,
    ) {
        this.networkInternalHostname = networkInternalHostname;
        this.networkInternalPorNum = networkInternalPorNum;
        this.maybeHostMachineUrl = maybeHostMachineUrl;
    }

    public getNetworkInternalHostname(): string {
        return this.networkInternalHostname;
    }

    public getNetworkInternalPortNum(): number {
        return this.networkInternalPorNum;
    }

    public getMaybeHostMachineUrl(): string | undefined {
        return this.maybeHostMachineUrl;
    }
}

export async function addContractHelperService(
    networkCtx: NetworkContext,
    dbHostname: string,
    dbPortNum: number,
    dbUsername: string,
    dbUserPassword: string,
    dbName: string,
    nearupHostname: string,
    nearupPort: number,
    validatorKey: NearKey,   // Created in the Nearup service
): Promise<Result<ContractHelperServiceInfo, Error>> {
    log.info(`Adding contract helper service running on port '${DOCKER_PORT_DESC}'`);
    const usedPortsSet: Set<string> = new Set();
    usedPortsSet.add(DOCKER_PORT_DESC)

    const envvars: Map<string, string> = new Map();
    envvars.set(
        ACCOUNT_CREATOR_KEY_ENVVAR,
        JSON.stringify(validatorKey),
    )
    envvars.set(
        INDEXER_DB_CONNECTION_ENVVAR,
        `postgres://${dbUsername}:${dbUserPassword}@${dbHostname}:${dbPortNum}/${dbName}`
    )
    envvars.set(
        NODE_RPC_URL_ENVVAR,
        `http://${nearupHostname}:${nearupPort}`
    )
    for (let [key, value] of STATIC_ENVVARS.entries()) {
        envvars.set(key, value);
    }

    const containerConfigSupplier: ContainerConfigSupplier = (ipAddr: string, sharedDirpath: SharedPath): Result<ContainerConfig, Error> => {
        const result: ContainerConfig = new ContainerConfigBuilder(
            IMAGE,
        ).withUsedPorts(
            usedPortsSet
        ).withEnvironmentVariableOverrides(
            envvars
        ).build();
        return ok(result);
    }
    
    const addServiceResult: Result<[ServiceContext, Map<string, PortBinding>], Error> = await networkCtx.addService(SERVICE_ID, containerConfigSupplier);
    if (addServiceResult.isErr()) {
        return err(addServiceResult.error);
    }
    const [serviceCtx, hostMachinePortBindings]: [ServiceContext, Map<string, PortBinding>] = addServiceResult.value;
    const maybeHostMachinePortBinding: PortBinding | undefined = hostMachinePortBindings.get(DOCKER_PORT_DESC);

    const formHostMachineUrlResult: Result<string | undefined, Error> = tryToFormHostMachineUrl(
        maybeHostMachinePortBinding,
        (ipAddr: string, portNum: number) => `http://${ipAddr}:${portNum}`
    )
    if (formHostMachineUrlResult.isErr()) {
        return err(formHostMachineUrlResult.error);
    }
    const maybeHostMachineUrl: string | undefined = formHostMachineUrlResult.value;

    const result: ContractHelperServiceInfo = new ContractHelperServiceInfo(
        SERVICE_ID,
        PORT_NUM,
        maybeHostMachineUrl,
    );

    return ok(result);
}
