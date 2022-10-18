import { EnclaveContext, PortSpec, PortProtocol, ServiceID, ContainerConfig, ContainerConfigBuilder, ServiceContext } from "kurtosis-sdk";
import log from "loglevel";
import { Result, ok, err } from "neverthrow";
import { getPrivateAndPublicUrlsForPortId, ServiceUrl } from "../service_url";

const SERVICE_ID: ServiceID = "contract-helper-dynamo-db";
const IMAGE: string = "amazon/dynamodb-local:1.20.0";

// This is from the aws image and cannot be changes apparently
const PORT_ID = "default"
const DEFAULT_PORT_NUM = 8000
const DEFAULT_PORT_PROTOCOL = "TCP"
const DEFAULT_PORT_SPEC = new PortSpec(DEFAULT_PORT_NUM, PortProtocol.TCP);

export class ContractHelperDynamoDbInfo {
    constructor(
        public readonly privateUrl: ServiceUrl,
    ) {}
}

export async function addContractHelperDynamoDb(enclaveCtx: EnclaveContext): Promise<Result<ContractHelperDynamoDbInfo, Error>> {

    log.info("Adding contract helper DynamoDB running on default port '" + DEFAULT_PORT_NUM + "'");
    const usedPorts: Map<string, PortSpec> = new Map();
    usedPorts.set(PORT_ID, DEFAULT_PORT_SPEC);
    const containerConfig: ContainerConfig = new ContainerConfigBuilder(IMAGE).withUsedPorts(
        usedPorts
    ).build();

    const addServiceResult: Result<ServiceContext, Error> = await enclaveCtx.addService(SERVICE_ID, containerConfig);
    if (addServiceResult.isErr()) {
        return err(addServiceResult.error);
    }
    const serviceCtx: ServiceContext = addServiceResult.value;

    // TODO(gb): check availability somehow, maybe using the DynamoDb JS SDK

    const getUrlsResult = getPrivateAndPublicUrlsForPortId(
        serviceCtx,
        PORT_ID,
        DEFAULT_PORT_PROTOCOL,
        "",
    );
    if (getUrlsResult.isErr()) {
        return err(getUrlsResult.error);
    }
    const [privateUrl, publicUrl] = getUrlsResult.value;

    const result: ContractHelperDynamoDbInfo = new ContractHelperDynamoDbInfo(
        privateUrl,
    );

    return ok(result);
}
