export const allProperties = [];
export const users = [];

export const getBrokerProperties = (brokerId) => allProperties.filter((property) => property.brokerId === brokerId);
export const getBrokerByName = (name) => users.find((user) => user.name === name);
