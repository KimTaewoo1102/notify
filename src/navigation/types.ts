import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ID } from '../types/domain';

export type RootStackParamList = {
    Home: undefined;
    SectionDetail: { sectionId: ID };
    KeywordEdit: { sectionId: ID };
    AddSection: undefined;
    Trash: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
    NativeStackScreenProps<RootStackParamList, T>;

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace ReactNavigation {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface RootParamList extends RootStackParamList {}
    }
}

export type _UnusedNavigatorParams = NavigatorScreenParams<RootStackParamList>;
