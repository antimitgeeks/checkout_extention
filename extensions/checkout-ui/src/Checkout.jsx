
import {
  Banner,
  useApi,
  reactExtension,
  Checkbox,
  Grid,
  ScrollView,
  Disclosure,
  Button,
  View,
  BlockSpacer,
  Heading,
  Divider,
  useApplyMetafieldsChange
} from '@shopify/ui-extensions-react/checkout';
import { useState, useEffect } from 'react';

export default reactExtension(
  'purchase.checkout.cart-line-list.render-after',
  () => <Extension />,
);

const customerId = '8255250039067'
const SERVER_URL = 'https://hang-parameters-ata-modem.trycloudflare.com'


function Extension() {
  const { query } = useApi();

  const [showMore, setShowMore] = useState(true);
  const [selectedNpos, setSelectedNpos] = useState([]);
  const [apiData, setApiData] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [showNpo, setShowNpos] = useState(false);
  const [previousData, setPreviousData] = useState([]);
  const [previousLoading, setPreviousLoading] = useState(true)
  const [metaFields, setMetaFields] = useState();

  const updateMetafield = useApplyMetafieldsChange();

  useEffect(() => {
    query(
      `query ($id: ID!) {
        product(id: $id) {
          id
          title
          variants(first: 1) {
            nodes {
              id
              price {
                amount
              }
            }
          }
            metafields(identifiers : [{namespace: "custom", key: "npotesting"}]) {
            value
            type
            description
            id
            key
          }
        }
      }`,
      {
        variables: { id: "gid://shopify/Product/9047205151003" },
      }
    )
      .then(({ data, errors }) => {
        if (errors) {
          console.log('Product MetaFelids fetch Error : ', errors);
        }

        const metaFieldsDetails = data?.product?.metafields;
        if (metaFieldsDetails) {
          const filedArray = metaFieldsDetails
            .filter(metaFieldsDetail => metaFieldsDetail?.value)
            .flatMap(metaFieldsDetail => metaFieldsDetail.value.split(',').map(item => item.trim()));
          setMetaFields(filedArray);
        }
      })
      .catch((error) => console.error('Product MetaFelids fetch Error : ', error))
  }, []);
  console.log("Product MetaField :", metaFields);

  let afterSixData = metaFields?.slice(6, metaFields.length);


  useEffect(() => {
    const fetchData = async () => {

      await fetch(`${SERVER_URL}/customer-order?customerId=${customerId}`)
        .then((response) => response.text())
        .then((result) => {
          setPreviousLoading(false);
          console.log('Previous NPOS :', result);
          setPreviousData(result ? JSON.parse(result) : [])
        })
        .catch((error) => { setPreviousLoading(false); console.log('Error In Previous NPOS :', error); })
    }
    fetchData()
  }, []);


  useEffect(() => {
    const convertedData = previousData?.npos && previousData?.npos[0]?.split(',').map(item => item.trim());
    setSelectedNpos(convertedData || [])
    console.log("Npo Converted Data:", convertedData);
  }, [previousData])


  const handleCheckboxChange = (e, val) => {
    if (selectedNpos?.length >= 5) {
      setShowMore(!showMore);
      setShowMore(showMore)
    }
    if (e) {
      if (selectedNpos?.length >= 5) {
        setShowWarning(true);
      }
      else {
        setShowWarning(false)
        setSelectedNpos([...selectedNpos, val]);
      }
    } else {
      setShowWarning(false)
      setSelectedNpos((prev) => {
        return prev?.filter((itm) => {
          return itm !== val;
        });
      });
    }
  };

  console.log("Selected Npos :", selectedNpos);

  const updateMetafieldWithCheckedValues = () => {
    const checkedValues = selectedNpos.join(', ');
    console.log(checkedValues, '--------------checkedValues');
    updateMetafield({
      type: "updateMetafield",
      namespace: 'custom',
      key: 'ngo_data',
      valueType: "string",
      value: checkedValues,
    });
  };


  useEffect(() => {
    updateMetafieldWithCheckedValues();
  }, [selectedNpos]);


  return (
    <>
      <Checkbox toggles='donation' onChange={() => setShowNpos(!showNpo)}>
        Do Donation To NGOS
      </Checkbox>
      {
        showNpo &&
        <BlockSpacer />
      }
      {
        previousLoading ? ""
          :
          showNpo &&
          <View id='donation'>
            <Heading level={2}>NGO List</Heading>
            {showNpo &&
              <BlockSpacer />
            }
            {
              showWarning &&
              <>
                <Banner status='warning'>You can Only select Upto 5 Ngos</Banner>
                <BlockSpacer />
              </>
            }
            <Disclosure>
              <>
                <Grid
                  columns={['.38fr', '.34fr', '.3fr']}
                  rows={['fill', 'fill']}
                  spacing="tight"
                >
                  {metaFields?.slice(0, 6)?.map((itm, idx) => {
                    return <Checkbox checked={selectedNpos?.includes(itm)} onChange={(e) => handleCheckboxChange(e, itm)} key={idx} id={itm} name={itm}>
                      {itm}
                    </Checkbox>
                  })}
                </Grid>
                <BlockSpacer spacing={'tight'} />
                {
                  showMore ?
                    <>
                      {metaFields?.length > 6 &&
                        <Button kind='plain' toggles='npo' onPress={() => { setShowMore(!showMore) }}>
                          {showMore ? "Show More " : "Show Less "}
                        </Button>
                      }
                      {/* {myArr2?.length > 6 && <BlockSpacer />} */}
                      <ScrollView maxBlockSize={150}>
                        <View id='npo'>
                          <Grid
                            columns={['.42fr', '.35fr', '.3fr']}
                            rows={['fill', 'fill']}
                            spacing="tight"
                          >
                            {afterSixData?.map((itm, idx) => {
                              return <Checkbox checked={selectedNpos?.includes(itm)} onChange={(e) => handleCheckboxChange(e, itm)} >
                                {itm}
                              </Checkbox>
                            })}
                          </Grid>
                        </View>
                      </ScrollView>
                    </>
                    : <>
                      <ScrollView maxBlockSize={150}>
                        <View id='npo'>
                          <Grid
                            columns={['.43fr', '.38fr', '.3fr']}
                            rows={['fill', 'fill']}
                            spacing="tight"
                          >
                            {metaFields?.slice(6, metaFields.length)?.map((itm, idx) => {
                              return <Checkbox checked={selectedNpos?.includes(itm)} onChange={(e) => handleCheckboxChange(e, itm)} key={idx} id={itm} name={itm}>
                                {itm}
                              </Checkbox>
                            })}
                          </Grid>
                        </View>
                      </ScrollView>
                      {metaFields?.length > 6 &&
                        <>
                          <BlockSpacer />
                          <Button kind='plain' toggles='npo' onPress={() => { setShowMore(!showMore) }}>
                            {showMore ? "Show More " : "Show Less "}
                          </Button>
                          <BlockSpacer />
                        </>
                      }
                    </>
                }

              </>
            </Disclosure>
            <Divider />
          </View>
      }
    </>
  );
}